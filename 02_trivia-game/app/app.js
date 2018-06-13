'use strict';

// =================================================================================
// App Configuration
// =================================================================================

const {App} = require('jovo-framework');

const GAME_LENGTH = 5;
const ANSWER_COUNT = 4;

const config = {
    logging: true,
    intentMap: {
        'AMAZON.YesIntent': 'YesIntent',
        'AMAZON.NoIntent': 'NoIntent',
        'AMAZON.RepeatIntent': 'RepeatIntent',
        'AMAZON.StopIntent': 'StopIntent',
        'AMAZON.HelpIntent': 'HelpIntent',
        'AMAZON.CancelIntent': 'CancelIntent',
    },
};

const app = new App(config);


// =================================================================================
// App Logic
// =================================================================================

app.setHandler({
    'LAUNCH': function() {
        let speech = this.speechBuilder()
            .addT('NEW_GAME_MESSAGE', {gameName: this.t('GAME_NAME')})
            .addT('WELCOME_MESSAGE', {gameLength: GAME_LENGTH.toString()});
        this.followUpState('StartState').ask(speech);
    },
    'StartState': {
        'StartGameIntent': function() {
            // Select questions
            const translatedQuestions = this.t('QUESTIONS');
            const gameQuestions = populateGameQuestions(translatedQuestions);
            // Generate a random index for the correct answer, from 0 to 3
            const correctAnswerIndex = Math.floor(Math.random() * (ANSWER_COUNT));
            // Select and shuffle the answers for each question
            const roundAnswers = populateRoundAnswers(gameQuestions, 0, correctAnswerIndex, translatedQuestions);
            const currentQuestionIndex = 0;
            const spokenQuestion = Object.keys(translatedQuestions[gameQuestions[currentQuestionIndex]])[0];

            let speech = this.speechBuilder().addT('TELL_QUESTION_MESSAGE', {questionNumber: '1', question: spokenQuestion});

            for (let i = 0; i < ANSWER_COUNT; i++) {
                speech.addText(`${i + 1}. ${roundAnswers[i]}. `);
            }

            this.setSessionAttributes({
                questionSpeech: speech.build(),
                questionReprompt: speech.build(),
                currentQuestionIndex: currentQuestionIndex,
                correctAnswerIndex: correctAnswerIndex + 1,
                questions: gameQuestions,
                score: 0,
                correctAnswerText: translatedQuestions[gameQuestions[currentQuestionIndex]][Object.keys(translatedQuestions[gameQuestions[currentQuestionIndex]])[0]][0],
            });

            this.followUpState('TriviaState').ask(speech, speech);
        },
        'YesIntent': function() {
            this.toStateIntent('StartState', 'StartGameIntent');
        },
        'NoIntent': function() {
            this.tell(this.t('NO_MESSAGE'));
        },
    },
    'TriviaState': {
        'AnswerIntent': function() {
            handleUserGuess.call(answer, false);
        },
        'DontKnowIntent': function() {
            handleUserGuess.call(this, true);
        },
        'RepeatIntent': function() {
            this.ask(this.getSessionAttribute('questionSpeech'), this.getSessionAttribute('questionReprompt'));
        },
        'HelpIntent': function() {
            this.toStateIntent('HelpState', 'HelpUser', false);
        },
        'StopIntent': function() {
            let speech = this.speechBuilder()
                .addT('STOP_MESSAGE');
            this.followUpState('HelpState').ask(speech, speech);
        },
        'CancelIntent': function() {
            this.tell(this.t('CANCEL_MESSAGE'));
        },
        'Unhandled': function() {
            let speech = this.speechBuilder()
                .addT('TRIVIA_UNHANDLED', {answerCount: ANSWER_COUNT.toString()});
            this.ask(speech, speech);
        },
        'END': function() {
            // this.getEndReason() only works for Alexa Skills currently.
            if (this.isAlexaSkill()) {
                console.log('Session ended in TriviaState: ' + this.getEndReason());
            } else {
                console.log('Session ended in TriviaState');
            }
            this.endSession();
        },
    },
    'HelpState': {
        'HelpUser': function(newGame) {
            let askMessage = '';
            if (newGame) {
                askMessage = this.t('ASK_MESSAGE_START');
            } else {
                askMessage = this.t('REPEAT_QUESTION_MESSAGE') + this.t('STOP_MESSAGE');
            }
            let speech = this.speechBuilder()
                .addT('HELP_MESSAGE', {gameLength: GAME_LENGTH})
                .addText(askMessage);
            let reprompt = this.speechBuilder()
                .addT('HELP_REPROMPT')
                .addText(askMessage);

            this.ask(speech, reprompt);
        },
        'AMAZON.StartOverIntent': function() {
            this.toStateIntent('StartState', 'StartGameIntent', false);
        },
        'RepeatIntent': function() {
            let newGame = !(this.getSessionAttribute('questionSpeech') && this.getSessionAttribute('questionReprompt'));
            this.toStateIntent('HelpState', 'HelpUser', newGame);
        },
        'HelpIntent': function() {
            let newGame = !(this.getSessionAttribute('questionSpeech') && this.getSessionAttribute('questionReprompt'));
            this.toStateIntent('HelpState', 'HelpUser', newGame);
        },
        'YesIntent': function() {
            if (this.getSessionAttribute('questionSpeech') && this.getSessionAttribute('questionReprompt')) {
                this.toStateIntent('TriviaState', 'RepeatIntent');
            } else {
                this.toStateIntent('StartState', 'StartGameIntent', false);
            }
        },
        'NoIntent': function() {
            this.tell(this.t('NO_MESSAGE'));
        },
        'StopIntent': function() {
            let speech = this.speechBuilder()
                .addT('STOP_MESSAGE');
            this.ask(speech, speech);
        },
        'END': function() {
            // this.getEndReason() only works for Alexa Skills currently.
            if (this.isAlexaSkill()) {
                console.log('Session ended in HelpState: ' + this.getEndReason());
            } else {
                console.log('Session ended in HelpState');
            }
            this.endSession();
        },
    },
});

// =================================================================================
// Helper
// =================================================================================

/**
 * Selects 5 (GAME_LENGTH) questions from i18n file.
 * @param {object} translatedQuestions questions from the i18n file
 * @return {object} gameQuestions questions which will be used in the game
 */
function populateGameQuestions(translatedQuestions) {
    const gameQuestions = [];
    const indexList = [];

    let index = translatedQuestions.length;

    if (GAME_LENGTH > index) {
        throw new Error('Invalid Game Length. Not enough questions');
    }
    for (let i = 0; i < translatedQuestions.length; i++) {
        indexList.push(i);
    }

    for (let j = 0; j < GAME_LENGTH; j++) {
        const rand = Math.floor(Math.random() * index);
        index--;

        const temp = indexList[index];
        indexList[index] = indexList[rand];
        indexList[rand] = temp;
        gameQuestions.push(indexList[index]);
    }
    return gameQuestions;
}

/**
 * Get the answers for a given question, and place the correct answer at the spot marked by the
 * correctAnswerTargetLocation variable. Note that you can have as many answers as you want but
 * only ANSWER_COUNT will be selected.
 * @param {object} gameQuestionIndexes questions which will be used in the game
 * @param {number} correctAnswerIndex current spot of the correct answer
 * @param {number} correctAnswerTargetLocation used to determine future spot of the correct answer
 * @param {object} translatedQuestions questions from the i18n file
 * @return {object}
 * */
function populateRoundAnswers(gameQuestionIndexes, correctAnswerIndex, correctAnswerTargetLocation, translatedQuestions) {
    const answers = [];
    const answersCopy = translatedQuestions[gameQuestionIndexes[correctAnswerIndex]][Object.keys(translatedQuestions[gameQuestionIndexes[correctAnswerIndex]])[0]].slice();
    let index = answersCopy.length;

    if (index < ANSWER_COUNT) {
        throw new Error('Not enough answers for question.');
    }

    // Shuffle the answers, excluding the first element which is the correct answer.
    for (let j = 1; j < answersCopy.length; j++) {
        const rand = Math.floor(Math.random() * (index - 1)) + 1;
        index -= 1;
        console.log(rand);
        const swapTemp1 = answersCopy[index];
        answersCopy[index] = answersCopy[rand];
        answersCopy[rand] = swapTemp1;
    }

    // Swap the correct answer into the target location
    for (let i = 0; i < ANSWER_COUNT; i++) {
        answers[i] = answersCopy[i];
    }
    const swapTemp2 = answers[0];
    answers[0] = answers[correctAnswerTargetLocation];
    answers[correctAnswerTargetLocation] = swapTemp2;
    return answers;
}

/**
 * @param {object} answer user input
 * @return {boolean}
 */
function isAnswerSlotValid(answer) {
    console.log(answer.value);
    console.log(parseInt(answer.value));
    if (answer.value) {
        return !isNaN(parseInt(answer.value, 10)) && parseInt(answer.value, 10) < (ANSWER_COUNT + 1) && parseInt(answer.value, 10) > 0;
    }
}

/**
 *  @param {object} answer user input
 * @param {boolean} userGaveUp
 */
function handleUserGuess(answer, userGaveUp) {
    console.log("getInput: " + answer);
    const answerSlotValid = isAnswerSlotValid(answer);
    let speech = this.speechBuilder();
    let speechOutputAnalysis = this.speechBuilder();
    const gameQuestions = this.getSessionAttribute('questions');
    let correctAnswerIndex = parseInt(this.getSessionAttribute('correctAnswerIndex'), 10);
    let currentScore = parseInt(this.getSessionAttribute('score'), 10);
    let currentQuestionIndex = parseInt(this.getSessionAttribute('currentQuestionIndex'), 10);
    const correctAnswerText = this.getSessionAttribute('correctAnswerText');
    const translatedQuestions = this.t('QUESTIONS');
    console.log(answerSlotValid);
    if (answerSlotValid && parseInt(this.getInput('answer').value, 10) === this.getSessionAttribute('correctAnswerIndex')) {
        currentScore++;
        speechOutputAnalysis.addT('ANSWER_CORRECT_MESSAGE');
    } else {
        if (!userGaveUp) {
            speechOutputAnalysis.addT('ANSWER_WRONG_MESSAGE');
        }

        speechOutputAnalysis.addT('CORRECT_ANSWER_MESSAGE', {correctAnswerIndex: correctAnswerIndex, correctAnswerText: correctAnswerText});
    }

    if (this.getSessionAttribute('currentQuestionIndex') === GAME_LENGTH - 1) {
        speech
            .addText(userGaveUp ? '' : this.t('ANSWER_IS_MESSAGE'))
            .addText(speechOutputAnalysis.build())
            .addT('GAME_OVER_MESSAGE', {currentScore: currentScore.toString(), gameLength: GAME_LENGTH.toString()});

        this.tell(speech);
    } else {
        currentQuestionIndex += 1;
        correctAnswerIndex = Math.floor(Math.random() * (ANSWER_COUNT));
        const spokenQuestion = Object.keys(translatedQuestions[gameQuestions[currentQuestionIndex]])[0];
        const roundAnswers = populateRoundAnswers.call(this, gameQuestions, currentQuestionIndex, correctAnswerIndex, translatedQuestions);
        const questionIndexForSpeech = currentQuestionIndex + 1;
        let reprompt = this.speechBuilder()
            .addT('TELL_QUESTION_MESSAGE', {questionNumber: questionIndexForSpeech.toString(), question: spokenQuestion});

        for (let i = 0; i < ANSWER_COUNT; i++) {
            reprompt.addText(`${i + 1}. ${roundAnswers[i]}. `);
        }

        speech
            .addText(userGaveUp ? '' : this.t('ANSWER_IS_MESSAGE'))
            .addText(speechOutputAnalysis.build())
            .addT('SCORE_IS_MESSAGE', {currentScore: currentScore.toString()})
            .addText(reprompt.build());

        this.setSessionAttributes({
            questionSpeech: reprompt.build(),
            questionReprompt: reprompt.build(),
            currentQuestionIndex: currentQuestionIndex,
            correctAnswerIndex: correctAnswerIndex + 1,
            questions: gameQuestions,
            score: currentScore,
            correctAnswerText: translatedQuestions[gameQuestions[currentQuestionIndex]][Object.keys(translatedQuestions[gameQuestions[currentQuestionIndex]])[0]][0],
        });
        this.followUpState('TriviaState').ask(speech, reprompt);
    }
    return speech;
}

module.exports.app = app;
