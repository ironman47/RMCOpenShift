const Telegraf = require('telegraf');
const {
    Extra,
    Markup
} = require('telegraf');

const config = require('./config');
const dataService = require('./dataService');

const express = require('express');
const expressApp = express();

const port = process.env.OPENSHIFT_NODEJS_PORT || 3000
expressApp.get('/', (req, res) => {
  res.send('Hello World!')
})
expressApp.listen(port, () => {
  console.log(`Listening on port ${port}`)
})

const bot = new Telegraf(config.botToken);

const helpMsg = `Command reference:
/start - Start bot (mandatory in groups)
/inccap - Increment counter for cap
/incmask - Increment counter for mask
/incfilter - Increment counter for filter
/donatecap - Decrement counter for cap
/donatemask - Decrement counter for mask
/donatefilter - Decrement counter for filter
/getall - Show all counters
/stop - Attemt to stop bot

/help - Show this help page

Tip: You can also use e.g. '/incmask 5' to increase mask by five counts.`;

//about - Show information about the bot
//getmask - Show current counter for mask
//getfilter - Show value of counter for filter
//resetmaskArOn9 - Reset counter for mask back to 0
//resetfilterArOn9 - Reset counter for filter x back to 0
//setmaskArOn9 y - Set counter for mask to y [/set y]
//setfilterArOn9 y - Set counter for filter x to y [/setx y]

const inputErrMsg = `💥 BOOM... 🔩☠🔧🔨⚡️
Hm, that wasn't supposed to happen. You didn't input invalid characters, did you?
The usage for this command is \"/set x\", where x is a number.
At the moment, I can only count integers, if you want to add your own number system, please feel free to do so. Just click here: /about `;

const incNMsg = `Please input with number diu nei`;

const donateErrMsg = `We do not have enough stock, diu nei.`;

const aboutMsg = "This bot modified from the bot that was created by @LeoDJ\nSource code and contact information can be found at https://github.com/LeoDJ/telegram-counter-bot";

function getRegExp(command) {
    return new RegExp("/" + command + "[0-9]*\\b");
}

//get username for group command handling
bot.telegram.getMe().then((botInfo) => {
    bot.options.username = botInfo.username;
    console.log("Initialized", botInfo.username);
});

dataService.loadUsers();

function userString(ctx) {
    return JSON.stringify(ctx.from.id == ctx.chat.id ? ctx.from : {
        from: ctx.from,
        chat: ctx.chat
    });
}

function logMsg(ctx) {
    var from = userString(ctx);
    console.log('<', ctx.message.text, from)
}

function logOutMsg(ctx, text) {
    console.log('>', {
        id: ctx.chat.id
    }, text);
}

bot.command('broadcast', ctx => {
    if(ctx.from.id == config.adminChatId) {
        var words = ctx.message.text.split(' ');
        words.shift(); //remove first word (which ist "/broadcast")
        if(words.length == 0) //don't send empty message
            return;
        var broadcastMessage = words.join(' ');
        var userList = dataService.getUserList();
        console.log("Sending broadcast message to", userList.length, "users:  ", broadcastMessage);
        userList.forEach(userId => {
            console.log(">", {id: userId}, broadcastMessage);
            ctx.telegram.sendMessage(userId, broadcastMessage);
        });
    }
});

bot.command('start', ctx => {
    logMsg(ctx);
    dataService.registerUser(ctx);
    dataService.setCounter(ctx.chat.id, '0', 0);
    var m = "Hello, I'm your personal counter bot, simply use the commands to control the counter";
    ctx.reply(m);
    logOutMsg(ctx, m);
    setTimeout(() => {
        ctx.reply(0);
        logOutMsg(ctx, 0)
    }, 50); //workaround to send this message definitely as second message
});

bot.command('stop', ctx => {
    logMsg(ctx);
    var m = "I'm sorry, Dave, I'm afraid I can't do that.";
    logOutMsg(ctx, m);
    ctx.reply(m);
});

bot.command(['getx', 'setx', 'resetx'], ctx => {
    logMsg(ctx);
    logOutMsg(ctx, incNMsg);
    ctx.reply(incNMsg);
});

bot.command('help', ctx => {
    logMsg(ctx);
    logOutMsg(ctx, helpMsg);
    ctx.reply(helpMsg);
});

bot.command('about', ctx => {
    logMsg(ctx);
    logOutMsg(ctx, aboutMsg);
    ctx.reply(aboutMsg);
});

bot.command('getall', ctx => {
    logMsg(ctx);
    counters = dataService.getAllCounters(ctx.chat.id);
    msg = "";
    Object.keys(counters).forEach(counterId => {
        msg += '[' + counterId + '] ' + counters[counterId].value + "\n";
    });
    logOutMsg(ctx, msg);
    ctx.reply(msg);
});

bot.hears(getRegExp('inccap'), ctx => {
    logMsg(ctx);
    currentCommand = 'inccap';
    var m = ctx.message.text.match(getRegExp(currentCommand))[0]; //filter command
    var counterId = 'cap'; //get id of command, return 0 if not found

    var delta = 1;
    params = ctx.message.text.split(" ");
    if (params.length == 2 && !isNaN(params[1])) {
        delta = Math.floor(params[1]);
    
		var val = +dataService.getCounter(ctx.chat.id, counterId);
		val += delta;
		dataService.setCounter(ctx.chat.id, counterId, val);

		var printCounterId = counterId ? "[" + counterId + "] " : "";
		val = printCounterId + val;
    } else {
		val = incNMsg;
	}
	
	logOutMsg(ctx, val);
    ctx.reply(val);
});

bot.hears(getRegExp('incmask'), ctx => {
    logMsg(ctx);
    currentCommand = 'incmask';
    var m = ctx.message.text.match(getRegExp(currentCommand))[0]; //filter command
    var counterId = 'mask'; //get id of command, return 0 if not found

    if (params.length == 2 && !isNaN(params[1])) {
        delta = Math.floor(params[1]);
    
		var val = +dataService.getCounter(ctx.chat.id, counterId);
		val += delta;
		dataService.setCounter(ctx.chat.id, counterId, val);

		var printCounterId = counterId ? "[" + counterId + "] " : "";
		val = printCounterId + val;
    } else {
		val = incNMsg;
	}
	
    logOutMsg(ctx, val);
    ctx.reply(val);
});

bot.hears(getRegExp('incfilter'), ctx => {
    logMsg(ctx);
    currentCommand = 'incfilter';
    var m = ctx.message.text.match(getRegExp(currentCommand))[0]; //filter command
    var counterId = 'filter'; //get id of command, return 0 if not found

    var delta = 1;
    params = ctx.message.text.split(" ");
    if (params.length == 2 && !isNaN(params[1])) {
        delta = Math.floor(params[1]);
    
		var val = +dataService.getCounter(ctx.chat.id, counterId);
		val += delta;
		dataService.setCounter(ctx.chat.id, counterId, val);

		var printCounterId = counterId ? "[" + counterId + "] " : "";
		val = printCounterId + val;
    } else {
		val = incNMsg;
	}
	
    logOutMsg(ctx, val);
    ctx.reply(val);
});


bot.hears(getRegExp('donatecap'), ctx => {
    logMsg(ctx);
    currentCommand = 'donatecap';
    var m = ctx.message.text.match(getRegExp(currentCommand))[0]; //filter command
    var counterId = 'cap'; //get id of command, return 0 if not found
//get today
	var today = new Date();
	var dd = today.getDate();
	var mm = today.getMonth()+1; //January is 0!
	var yyyy = today.getFullYear();
	
	if(dd<10) {
		dd = '0'+dd
	} 

	if(mm<10) {
		mm = '0'+mm
	} 

	today = yyyy + mm + dd;

    var delta = 1;
    params = ctx.message.text.split(" ");
    if (params.length == 2 && !isNaN(params[1])) {
        delta = Math.floor(params[1]);
    
	var donatecounterID = 'donatedcap' + today
	
    var val = +dataService.getCounter(ctx.chat.id, counterId);
    val -= delta;
	if(val>0) {
		dataService.setCounter(ctx.chat.id, counterId, val);
		
		var val1 = +dataService.getCounter(ctx.chat.id, donatecounterID);
		val1 += delta;
		dataService.setCounter(ctx.chat.id, donatecounterID, val1)

		var printCounterId = counterId ? "[" + counterId + "] " : "";
		var printCounterId1 = donatecounterID ? "; [" + donatecounterID + "] " : "";
		val = printCounterId + val + printCounterId1 + val1;
	} else {
        val = donateErrMsg;
    }
	} else {
		val = incNMsg;
	}
	
	logOutMsg(ctx, val);
	ctx.reply(val);

});

bot.hears(getRegExp('donatemask'), ctx => {
    logMsg(ctx);
    currentCommand = 'donatemask';
    var m = ctx.message.text.match(getRegExp(currentCommand))[0]; //filter command
    var counterId = 'mask'; //get id of command, return 0 if not found
//get today
	var today = new Date();
	var dd = today.getDate();
	var mm = today.getMonth()+1; //January is 0!
	var yyyy = today.getFullYear();
	
	if(dd<10) {
		dd = '0'+dd
	} 

	if(mm<10) {
		mm = '0'+mm
	} 

	today = yyyy + mm + dd;

    var delta = 1;
    params = ctx.message.text.split(" ");
    if (params.length == 2 && !isNaN(params[1])) {
        delta = Math.floor(params[1]);

	var donatecounterID = 'donatedmask' + today
	
    var val = +dataService.getCounter(ctx.chat.id, counterId);
    val -= delta;
	if(val>0) {
		dataService.setCounter(ctx.chat.id, counterId, val);
		
		var val1 = +dataService.getCounter(ctx.chat.id, donatecounterID);
		val1 += delta;
		dataService.setCounter(ctx.chat.id, donatecounterID, val1)

		var printCounterId = counterId ? "[" + counterId + "] " : "";
		var printCounterId1 = donatecounterID ? "; [" + donatecounterID + "] " : "";
		val = printCounterId + val + printCounterId1 + val1;
	} else {
        val = donateErrMsg;
    }
	} else {
		val = incNMsg;
	}
	
    logOutMsg(ctx, val);
    ctx.reply(val);
});

bot.hears(getRegExp('donatefilter'), ctx => {
    logMsg(ctx);
    currentCommand = 'donatefilter';
    var m = ctx.message.text.match(getRegExp(currentCommand))[0]; //filter command
    var counterId = 'filter'; //get id of command, return 0 if not found
//get today
	var today = new Date();
	var dd = today.getDate();
	var mm = today.getMonth()+1; //January is 0!
	var yyyy = today.getFullYear();
	
	if(dd<10) {
		dd = '0'+dd
	} 

	if(mm<10) {
		mm = '0'+mm
	} 

	today = yyyy + mm + dd;

    var delta = 1;
    params = ctx.message.text.split(" ");
    if (params.length == 2 && !isNaN(params[1])) {
        delta = Math.floor(params[1]);

	var donatecounterID = 'donatedfilter' + today

    var val = +dataService.getCounter(ctx.chat.id, counterId);
    val -= delta;
	if(val>0) {
		dataService.setCounter(ctx.chat.id, counterId, val);
		
		var val1 = +dataService.getCounter(ctx.chat.id, donatecounterID);
		val1 += delta;
		dataService.setCounter(ctx.chat.id, donatecounterID, val1)

		var printCounterId = counterId ? "[" + counterId + "] " : "";
		var printCounterId1 = donatecounterID ? "; [" + donatecounterID + "] " : "";
		val = printCounterId + val + printCounterId1 + val1;
	} else {
        val = donateErrMsg;
    }
	} else {
		val = incNMsg;
	}
	
    logOutMsg(ctx, val);
    ctx.reply(val);
});

bot.hears(getRegExp('resetcapArOn9'), ctx => {
    logMsg(ctx);
    currentCommand = 'resetcapArOn9';
    var m = ctx.message.text.match(getRegExp(currentCommand))[0]; //filter command
    var counterId = 'cap'; //get id of command, return 0 if not found

    var val = 0;
    dataService.setCounter(ctx.chat.id, counterId, val);

    var printCounterId = counterId ? "[" + counterId + "] " : "";
    val = printCounterId + val;
    logOutMsg(ctx, val);
    ctx.reply(val);
});

bot.hears(getRegExp('resetmaskArOn9'), ctx => {
    logMsg(ctx);
    currentCommand = 'resetmaskArOn9';
    var m = ctx.message.text.match(getRegExp(currentCommand))[0]; //filter command
    var counterId = 'mask'; //get id of command, return 0 if not found

    var val = 0;
    dataService.setCounter(ctx.chat.id, counterId, val);

    var printCounterId = counterId ? "[" + counterId + "] " : "";
    val = printCounterId + val;
    logOutMsg(ctx, val);
    ctx.reply(val);
});

bot.hears(getRegExp('resetfilterArOn9'), ctx => {
    logMsg(ctx);
    currentCommand = 'resetfilterArOn9';
    var m = ctx.message.text.match(getRegExp(currentCommand))[0]; //filter command
    var counterId = 'filter'; //get id of command, return 0 if not found

    var val = 0;
    dataService.setCounter(ctx.chat.id, counterId, val);

    var printCounterId = counterId ? "[" + counterId + "] " : "";
    val = printCounterId + val;
    logOutMsg(ctx, val);
    ctx.reply(val);
});

bot.hears(getRegExp('getcap'), ctx => {
    logMsg(ctx);
    currentCommand = 'getcap';
    var m = ctx.message.text.match(getRegExp(currentCommand))[0]; //filter command
    var counterId = 'cap'; //get id of command, return 0 if not found

    var val = +dataService.getCounter(ctx.chat.id, counterId);

    var printCounterId = counterId ? "[" + counterId + "] " : "";
    val = printCounterId + val;
    logOutMsg(ctx, val);
    ctx.reply(val);
});

bot.hears(getRegExp('getmask'), ctx => {
    logMsg(ctx);
    currentCommand = 'getmask';
    var m = ctx.message.text.match(getRegExp(currentCommand))[0]; //filter command
    var counterId = 'mask'; //get id of command, return 0 if not found

    var val = +dataService.getCounter(ctx.chat.id, counterId);

    var printCounterId = counterId ? "[" + counterId + "] " : "";
    val = printCounterId + val;
    logOutMsg(ctx, val);
    ctx.reply(val);
});

bot.hears(getRegExp('getfilter'), ctx => {
    logMsg(ctx);
    currentCommand = 'getfilter';
    var m = ctx.message.text.match(getRegExp(currentCommand))[0]; //filter command
    var counterId = 'filter'; //get id of command, return 0 if not found

    var val = +dataService.getCounter(ctx.chat.id, counterId);

    var printCounterId = counterId ? "[" + counterId + "] " : "";
    val = printCounterId + val;
    logOutMsg(ctx, val);
    ctx.reply(val);
});

bot.hears(getRegExp('getall'), ctx => {
    logMsg(ctx);
    currentCommand = 'getall';
    var m = ctx.message.text.match(getRegExp(currentCommand))[0]; //filter command
    var counterId = 'all'; //get id of command, return 0 if not found

    var val = +dataService.getCounter(ctx.chat.id, counterId);

    var printCounterId = counterId ? "[" + counterId + "] " : "";
    val = printCounterId + val;
    logOutMsg(ctx, val);
    ctx.reply(val);
});


bot.hears(getRegExp('setcapArOn9'), ctx => {
    logMsg(ctx);
    currentCommand = 'setcapArOn9';
    var m = ctx.message.text.match(getRegExp(currentCommand))[0]; //filter command
    var counterId = 'cap'; //get id of command, return 0 if not found

    params = ctx.message.text.split(" ");
    if (params.length == 2 && !isNaN(params[1])) {
        var val = Math.floor(params[1]);
        dataService.setCounter(ctx.chat.id, counterId, val);
        var printCounterId = counterId ? "[" + counterId + "] " : "";
        val = printCounterId + val;
    } else {
        val = inputErrMsg;
    }

    logOutMsg(ctx, val);
    ctx.reply(val);
});

bot.hears(getRegExp('setmaskArOn9'), ctx => {
    logMsg(ctx);
    currentCommand = 'setmaskArOn9';
    var m = ctx.message.text.match(getRegExp(currentCommand))[0]; //filter command
    var counterId = 'mask'; //get id of command, return 0 if not found

    params = ctx.message.text.split(" ");
    if (params.length == 2 && !isNaN(params[1])) {
        var val = Math.floor(params[1]);
        dataService.setCounter(ctx.chat.id, counterId, val);
        var printCounterId = counterId ? "[" + counterId + "] " : "";
        val = printCounterId + val;
    } else {
        val = inputErrMsg;
    }

    logOutMsg(ctx, val);
    ctx.reply(val);
});

bot.hears(getRegExp('setfilterArOn9'), ctx => {
    logMsg(ctx);
    currentCommand = 'setfilterArOn9';
    var m = ctx.message.text.match(getRegExp(currentCommand))[0]; //filter command
    var counterId = 'filter'; //get id of command, return 0 if not found

    params = ctx.message.text.split(" ");
    if (params.length == 2 && !isNaN(params[1])) {
        var val = Math.floor(params[1]);
        dataService.setCounter(ctx.chat.id, counterId, val);
        var printCounterId = counterId ? "[" + counterId + "] " : "";
        val = printCounterId + val;
    } else {
        val = inputErrMsg;
    }

    logOutMsg(ctx, val);
    ctx.reply(val);
});

bot.startPolling();


module.exports = {

}
