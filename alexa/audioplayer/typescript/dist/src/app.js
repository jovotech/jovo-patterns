"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const jovo_framework_1 = require("jovo-framework");
const jovo_platform_alexa_1 = require("jovo-platform-alexa");
const jovo_plugin_debugger_1 = require("jovo-plugin-debugger");
const jovo_db_filedb_1 = require("jovo-db-filedb");
// ------------------------------------------------------------------
// APP INITIALIZATION
// ------------------------------------------------------------------
const app = new jovo_framework_1.App();
exports.app = app;
// prettier-ignore
app.use(new jovo_platform_alexa_1.Alexa(), new jovo_plugin_debugger_1.JovoDebugger(), new jovo_db_filedb_1.FileDb());
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
        this.$alexaSkill.$audioPlayer
            .setOffsetInMilliseconds(0)
            .play(song, 'token')
            .tell('Hello World!');
    },
    PauseIntent() {
        this.$alexaSkill.$audioPlayer.stop();
        // Save offset to database.
        this.$user.$data.offset = this.$alexaSkill.$audioPlayer.getOffsetInMilliseconds();
        this.tell('Paused!');
    },
    ResumeIntent() {
        this.$alexaSkill.$audioPlayer
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
            this.$alexaSkill.$audioPlayer.stop();
        },
        'AlexaSkill.PlaybackStopped'() {
            console.log('AlexaSkill.PlaybackStopped');
        },
        'AlexaSkill.PlaybackFailed'() {
            console.log('AlexaSkill.PlaybackFailed');
        },
    },
});
//# sourceMappingURL=app.js.map