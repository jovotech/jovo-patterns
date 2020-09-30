import { App } from 'jovo-framework';
import { Alexa, AlexaSpeechBuilder } from 'jovo-platform-alexa';
import { JovoDebugger } from 'jovo-plugin-debugger';
import { FileDb } from 'jovo-db-filedb';
import { GoogleAssistant } from 'jovo-platform-googleassistant';
import { GoogleActionSpeechBuilder } from 'jovo-platform-googleassistant/dist/src/core/GoogleActionSpeechBuilder';
import { Jovo } from 'jovo-core';

// ------------------------------------------------------------------
// APP INITIALIZATION
// ------------------------------------------------------------------

const app = new App();

// prettier-ignore
app.use(
  new Alexa(),
  new GoogleAssistant(),
  new JovoDebugger(),
  new FileDb(),
);

// ------------------------------------------------------------------
// APP LOGIC
// ------------------------------------------------------------------

const statements: Array<Array<string | boolean>> = [
  ['Mount Everest is the tallest mountain in the world.', true],
  ['The Atlantic Ocean is the biggest ocean on Earth.', false],
  ['The study of plants is known as botany.', true],
  ['Venus is the closest planet to our Sun.', false],
  ['Spiders have six legs.', false],
  ['Dolphins are mammals.', true],
  ['Earthworms do not have eyes.', true],
  ['The human body has four lungs.', false],
];

app.setHandler({
  LAUNCH() {
    this.$user.$data.index = 0;
    this.$user.$data.currentPoints = 0;
    addAudio(this, 'soundbank://soundlibrary/ui/gameshow/amzn_ui_sfx_gameshow_intro_01');
    this.$speech.addText(
      `Welcome to 'True or False'. I will tell you a fact, and you will say if it is true or false. Lets go!`
    );
    askQuestion(this);
  },

  NEW_USER() {
    this.$user.$data = {
      index: 0,
      totalPoints: 0,
      currentPoints: 0,
    };
  },

  TrueOrFalseIntent() {
    const input = this.$inputs.answer.id;
    const answer = parseBoolean(input!);
    console.log(`input answer:   ${answer}`);
    const index = this.$user.$data.index;
    const correctAnswer = statements[index][1];
    console.log(`correct answer: ${correctAnswer}`);
    if (answer === correctAnswer) {
      this.$user.$data.currentPoints++;
      addAudio(this, 'soundbank://soundlibrary/ui/gameshow/amzn_ui_sfx_gameshow_positive_response_02');
    } else {
      this.$user.$data.currentPoints--;
      addAudio(this, 'soundbank://soundlibrary/ui/gameshow/amzn_ui_sfx_gameshow_negative_response_02');
    }
    this.$user.$data.index++;
    askQuestion(this);
  },

  Unhandled() {
    this.ask('Please answer with "true" or "false".');
  },

  END() {
    this.tell('Good bye, see you soon!');
  },
});

function askQuestion(jovo: Jovo) {
  console.log(`index: ${jovo.$user.$data.index}`);
  if (jovo.$user.$data.index >= statements.length) {
    // statements list end
    console.log(`end`);
    jovo.$user.$data.totalPoints += jovo.$user.$data.currentPoints;
    addAudio(jovo, 'soundbank://soundlibrary/ui/gameshow/amzn_ui_sfx_gameshow_outro_01');
    jovo.$speech.addText(`Nice! You got ${jovo.$user.$data.currentPoints} points!
                              Your total points are: ${jovo.$user.$data.totalPoints}. See you next time!`);
    jovo.tell(jovo.$speech);
    return;
  }
  addAudio(jovo, 'soundbank://soundlibrary/ui/gameshow/amzn_ui_sfx_gameshow_neutral_response_01');
  jovo.$speech.addText(`True or false: ${statements[jovo.$user.$data.index][0]}`);
  jovo.$reprompt.addText("Please answer with 'true' or 'false'! ");
  jovo.ask(jovo.$speech, jovo.$reprompt);
}

function parseBoolean(val: string) {
  switch (val.trim().toLowerCase()) {
    case 'true':
      return true;
    case 'false':
      return false;
    default:
      return false;
  }
}

function addAudio(jovo: Jovo, url: string) {
  if (jovo.$alexaSkill) {
    (jovo.$speech as AlexaSpeechBuilder).addAudio(url);
  } else if (jovo.$googleAction) {
    (jovo.$speech as GoogleActionSpeechBuilder).addAudio(url, '', true, 1);
  }
}

export { app };
