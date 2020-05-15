import { App } from 'jovo-framework';
import { Alexa } from 'jovo-platform-alexa';
import { JovoDebugger } from 'jovo-plugin-debugger';
import { FileDb } from 'jovo-db-filedb';

// ------------------------------------------------------------------
// APP INITIALIZATION
// ------------------------------------------------------------------

const app = new App();

// prettier-ignore
app.use(
  new Alexa(), 
  new JovoDebugger(), 
  new FileDb(),
);

// ------------------------------------------------------------------
// APP LOGIC
// ------------------------------------------------------------------

const song = 'https://s3.amazonaws.com/jovo-songs/song1.mp3';

app.setHandler({
  LAUNCH() {
    return this.toIntent('PlayIntent');
  },

  PlayIntent() {
    // prettier-ignore
    this.$alexaSkill!.$audioPlayer!
      .setOffsetInMilliseconds(0)
      .play(song, 'token')
      .tell('Hello World!');
  },

  PauseIntent() {
    this.$alexaSkill!.$audioPlayer!.stop();

    // Save offset to database.
    this.$user.$data.offset = this.$alexaSkill!.$audioPlayer!.getOffsetInMilliseconds();
    this.tell('Paused!');
  },

  ResumeIntent() {
	this.$alexaSkill!.$audioPlayer!
	  .setOffsetInMilliseconds(this.$user.$data.offset)
      .play(song, 'token')
      .tell('Resuming!');
  },

  AUDIOPLAYER: {
    'AlexaSkill.PlaybackStarted'() {
      console.log('AlexaSkill.PlaybackStarted');
    },

    'AlexaSkill.PlaybackNearlyFinished'() {
      console.log('AlexaSkill.PlaybackNearlyFinished');
    },

    'AlexaSkill.PlaybackFinished'() {
      console.log('AlexaSkill.PlaybackFinished');

      this.$alexaSkill!.$audioPlayer!.stop();
    },

    'AlexaSkill.PlaybackStopped'() {
      console.log('AlexaSkill.PlaybackStopped');
    },

    'AlexaSkill.PlaybackFailed'() {
      console.log('AlexaSkill.PlaybackFailed');
    },
  },
});

export { app };
