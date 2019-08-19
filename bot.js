const Telegraf = require('telegraf');
const {
    Extra,
    Markup
} = require('telegraf');

const config = require('./config');
const dataService = require('./dataService');

const express = require('express');
const {pg, Pool} = require('pg');
const expressApp = express();

const pool = new Pool({
    user: "qstvfxgicffyxl",
    password: "07a39f1a35e521451748a362022e83a01ce728f5b4ca1edd73b0f73ebaf1fc43",
    database: "dagpt5qh3m0vj7",
    port: 5432,
    host: "ec2-54-243-193-59.compute-1.amazonaws.com",
    ssl: true
}); 

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

Tip: e.g. use '/incmask 5' to increase mask by five counts.`;

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

const incNMsg = `Please input with number.`;

const donateErrMsg = `We do not have enough stock.`;

const aboutMsg = "This bot modified from the bot that was created by @LeoDJ\nSource code and contact information can be found at https://github.com/LeoDJ/telegram-counter-bot";

const tempMsg = 'eg'

function getRegExp(command) {
    return new RegExp("/" + command + "[0-9]*\\b");
}

function setValue(value){
	tempMsg = value;
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
/*     counters = dataService.getAllCounters(ctx.chat.id);
    msg = "";
    Object.keys(counters).forEach(counterId => {
        msg += '[' + counterId + '] ' + counters[counterId].value + "\n";
    });
    logOutMsg(ctx, msg);
    ctx.reply(msg);
 */
	queryString = 'select sum(CASE WHEN "materialList"."materialName" = \'cap\' AND "materialList"."materialAction" = \'inc\' THEN "materialList"."materialAmount" ELSE 0 END) as materialActiontotal FROM public."materialList"';

	pool.query(queryString, function(err1,res1) {
		if(err1){
			throw err1;
		}
		
		queryString = 'select sum(CASE WHEN "materialList"."materialName" = \'mask\' AND "materialList"."materialAction" = \'inc\' THEN "materialList"."materialAmount" ELSE 0 END) as materialActiontotal FROM public."materialList"';
		
		pool.query(queryString, function(err2,res2) {
			if(err2){
				throw err2;
			}

			queryString = 'select sum(CASE WHEN "materialList"."materialName" = \'filter\' AND "materialList"."materialAction" = \'inc\' THEN "materialList"."materialAmount" ELSE 0 END) as materialActiontotal FROM public."materialList"';

			pool.query(queryString, function(err3,res3) {
				if(err3){
					throw err3;
				}

				queryString = 'select sum(CASE WHEN "materialList"."materialName" = \'cap\' AND "materialList"."materialAction" = \'donate\' THEN "materialList"."materialAmount" ELSE 0 END) as materialActiontotal FROM public."materialList"';

				pool.query(queryString, function(err4,res4) {
					if(err4){
						throw err4;
					}
					queryString = 'select sum(CASE WHEN "materialList"."materialName" = \'mask\' AND "materialList"."materialAction" = \'donate\' THEN "materialList"."materialAmount" ELSE 0 END) as materialActiontotal FROM public."materialList"';

					pool.query(queryString, function(err5,res5) {
						if(err5){
							throw err5;
						}
						queryString = 'select sum(CASE WHEN "materialList"."materialName" = \'filter\' AND "materialList"."materialAction" = \'donate\' THEN "materialList"."materialAmount" ELSE 0 END) as materialActiontotal FROM public."materialList"';

						pool.query(queryString, function(err6,res6) {
							if(err6){
								throw err6;
							}
							queryString = 'select sum(CASE WHEN "materialList"."materialName" = \'google\' AND "materialList"."materialAction" = \'inc\' THEN "materialList"."materialAmount" ELSE 0 END) as materialActiontotal FROM public."materialList"';

							pool.query(queryString, function(err7,res7) {
								if(err7){
									throw err7;
								}							
								queryString = 'select sum(CASE WHEN "materialList"."materialName" = \'google\' AND "materialList"."materialAction" = \'donate\' THEN "materialList"."materialAmount" ELSE 0 END) as materialActiontotal FROM public."materialList"';

								pool.query(queryString, function(err6,res6) {
									if(err8){
										throw err8;
									}
									ctx.reply("[caps remaining] " + (res1.rows[0].materialactiontotal-res4.rows[0].materialactiontotal) + "\n"
									+"[caps donated] " + (res4.rows[0].materialactiontotal) + "\n"
									+"[masks remaining] " + (res2.rows[0].materialactiontotal-res5.rows[0].materialactiontotal) + "\n"
									+"[masks donated] " + (res5.rows[0].materialactiontotal) + "\n"
									+"[filters remaining] " + (res3.rows[0].materialactiontotal-res6.rows[0].materialactiontotal) + "\n"
									+"[filters donated] " + (res6.rows[0].materialactiontotal));
									+"[googles remaining] " + (res7.rows[0].materialactiontotal-res6.rows[0].materialactiontotal) + "\n"
									+"[googles donated] " + (res6.rows[0].materialactiontotal));
								});	
							});	
						});			
					});			
				});			
			});			
		});			
	});			
});

bot.hears(getRegExp('inccap'), ctx => {
    logMsg(ctx);
    currentCommand = 'inccap';
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

    var delta = 1;
	params = ctx.message.text.split(" ");
    if (params.length == 2 && !isNaN(params[1])) {
        delta = Math.floor(params[1]);
    
		if (delta < 0) {
			ctx.reply(`Please enter positive numbers, e.g. /inccap 5.`);
		} else {
// reference INSERT INTO "materialList" values(18,'DLLM','test',20,'inc',1999,09,28);
				queryString = 'INSERT INTO "materialList" values(\''+ctx.message.from.id+'\',\''+ctx.message.from.first_name+'\',\''+counterId+'\','+delta+',\'inc'+'\','+yyyy+','+mm+','+dd+')';

				pool.query(queryString, function(err,res) {
						if(err){
							throw err;
						}
					});	
// reference select sum(CASE WHEN "materialList"."materialName" = 'cap' THEN "materialList"."materialAmount" ELSE 0 END) as materialActiontotal FROM public."materialList";
				queryString = 'select sum(CASE WHEN "materialList"."materialName" = \'cap\' AND "materialList"."materialAction" = \'inc\' THEN "materialList"."materialAmount" ELSE 0 END) as materialActiontotal FROM public."materialList"';
// test with	ctx.reply(queryString);

				pool.query(queryString, function(err,res) {
						if(err){
							throw err;
						}
						ctx.reply("[" + counterId + "] " + res.rows[0].materialactiontotal);
				});			
	
		}
    } else {
		ctx.reply(incNMsg);
	}
	
});

bot.hears(getRegExp('incgoogle'), ctx => {
    logMsg(ctx);
    currentCommand = 'incgoogle';
    var m = ctx.message.text.match(getRegExp(currentCommand))[0]; //filter command
    var counterId = 'google'; //get id of command, return 0 if not found
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

    var delta = 1;
	params = ctx.message.text.split(" ");
    if (params.length == 2 && !isNaN(params[1])) {
        delta = Math.floor(params[1]);
    
		if (delta < 0) {
			ctx.reply(`Please enter positive numbers, e.g. /incgoogle 5.`);
		} else {
// reference INSERT INTO "materialList" values(18,'DLLM','test',20,'inc',1999,09,28);
				queryString = 'INSERT INTO "materialList" values(\''+ctx.message.from.id+'\',\''+ctx.message.from.first_name+'\',\''+counterId+'\','+delta+',\'inc'+'\','+yyyy+','+mm+','+dd+')';

				pool.query(queryString, function(err,res) {
						if(err){
							throw err;
						}
					});	
// reference select sum(CASE WHEN "materialList"."materialName" = 'cap' THEN "materialList"."materialAmount" ELSE 0 END) as materialActiontotal FROM public."materialList";
				queryString = 'select sum(CASE WHEN "materialList"."materialName" = \'google\' AND "materialList"."materialAction" = \'inc\' THEN "materialList"."materialAmount" ELSE 0 END) as materialActiontotal FROM public."materialList"';
// test with	ctx.reply(queryString);

				pool.query(queryString, function(err,res) {
						if(err){
							throw err;
						}
						ctx.reply("[" + counterId + "] " + res.rows[0].materialactiontotal);
				});			
	
		}
    } else {
		ctx.reply(incNMsg);
	}
	
});

bot.hears(getRegExp('incmask'), ctx => {
    logMsg(ctx);
    currentCommand = 'incmask';
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

    var delta = 1;
    params = ctx.message.text.split(" ");
    if (params.length == 2 && !isNaN(params[1])) {
        delta = Math.floor(params[1]);
    
		if (delta < 0) {
			ctx.reply(`Please enter positive numbers, e.g. /incmask 5.`);
		} else {
// reference INSERT INTO "materialList" values(18,'DLLM','test',20,'inc',1999,09,28);
				queryString = 'INSERT INTO "materialList" values(\''+ctx.message.from.id+'\',\''+ctx.message.from.first_name+'\',\''+counterId+'\','+delta+',\'inc'+'\','+yyyy+','+mm+','+dd+')';

				pool.query(queryString, function(err,res) {
						if(err){
							throw err;
						}
					});	
// reference select sum(CASE WHEN "materialList"."materialName" = 'cap' THEN "materialList"."materialAmount" ELSE 0 END) as materialActiontotal FROM public."materialList";
				queryString = 'select sum(CASE WHEN "materialList"."materialName" = \'mask\' AND "materialList"."materialAction" = \'inc\' THEN "materialList"."materialAmount" ELSE 0 END) as materialActiontotal FROM public."materialList"';
// test with	ctx.reply(queryString);

				pool.query(queryString, function(err,res) {
						if(err){
							throw err;
						}
						ctx.reply("[" + counterId + "] " + res.rows[0].materialactiontotal);
				});			
		}
    } else {
		ctx.reply(incNMsg);
	}
});

bot.hears(getRegExp('incfilter'), ctx => {
    logMsg(ctx);
    currentCommand = 'incfilter';
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

    var delta = 1;
    params = ctx.message.text.split(" ");
    if (params.length == 2 && !isNaN(params[1])) {
        delta = Math.floor(params[1]);
    
		if (delta < 0) {
			ctx.reply(`Please enter positive numbers, e.g. /incfilter 5.`);
		} else {
// reference INSERT INTO "materialList" values(18,'DLLM','test',20,'inc',1999,09,28);
				queryString = 'INSERT INTO "materialList" values(\''+ctx.message.from.id+'\',\''+ctx.message.from.first_name+'\',\''+counterId+'\','+delta+',\'inc'+'\','+yyyy+','+mm+','+dd+')';

				pool.query(queryString, function(err,res) {
						if(err){
							throw err;
						}
					});	
// reference select sum(CASE WHEN "materialList"."materialName" = 'cap' THEN "materialList"."materialAmount" ELSE 0 END) as materialActiontotal FROM public."materialList";
				queryString = 'select sum(CASE WHEN "materialList"."materialName" = \'filter\' AND "materialList"."materialAction" = \'inc\' THEN "materialList"."materialAmount" ELSE 0 END) as materialActiontotal FROM public."materialList"';
// test with	ctx.reply(queryString);

				pool.query(queryString, function(err,res) {
						if(err){
							throw err;
						}
						ctx.reply("[" + counterId + "] " + res.rows[0].materialactiontotal);
				});			
		}
    } else {
		ctx.reply(incNMsg);
	}
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
    
		if (delta < 0) {
				ctx.reply(`Please enter positive numbers, e.g. /donatecap 5.`);
		} else {
//make sure the donation amount is more than stock
				queryString = 'select sum(CASE WHEN "materialList"."materialName" = \'cap\' AND "materialList"."materialAction" = \'inc\' THEN "materialList"."materialAmount" ELSE 0 END) as materialActiontotal FROM public."materialList"';

				pool.query(queryString, function(err,res) {
						if(err){
							throw err;
						}
						if((delta - res.rows[0].materialactiontotal) >0){
							ctx.reply(donateErrMsg);
						} else {
//record donation
							queryString = 'INSERT INTO "materialList" values(\''+ctx.message.from.id+'\',\''+ctx.message.from.first_name+'\',\''+counterId+'\','+delta+',\'donate'+'\','+yyyy+','+mm+','+dd+')';

							pool.query(queryString, function(err1,res1) {
								if(err1){
									throw err1;
								}
							});
//bot reply with the right amount.
							queryString = 'select sum(CASE WHEN "materialList"."materialName" = \'cap\' AND "materialList"."materialAction" = \'donate\' THEN "materialList"."materialAmount" ELSE 0 END) as materialActiontotal FROM public."materialList"';

							pool.query(queryString, function(err2,res2) {
								if(err){
									throw err;
								}
								ctx.reply("[caps donated] " + res2.rows[0].materialactiontotal + ", [caps remaining] " + (res.rows[0].materialactiontotal - res2.rows[0].materialactiontotal));
							});			

						}
						
				});
		}		
	} else {
		ctx.reply(incNMsg);
	}
});


bot.hears(getRegExp('donategoogle'), ctx => {
    logMsg(ctx);
    currentCommand = 'donategoogle';
    var m = ctx.message.text.match(getRegExp(currentCommand))[0]; //filter command
    var counterId = 'google'; //get id of command, return 0 if not found
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
    
		if (delta < 0) {
				ctx.reply(`Please enter positive numbers, e.g. /donategoogle 5.`);
		} else {
//make sure the donation amount is more than stock
				queryString = 'select sum(CASE WHEN "materialList"."materialName" = \'google\' AND "materialList"."materialAction" = \'inc\' THEN "materialList"."materialAmount" ELSE 0 END) as materialActiontotal FROM public."materialList"';

				pool.query(queryString, function(err,res) {
						if(err){
							throw err;
						}
						if((delta - res.rows[0].materialactiontotal) >0){
							ctx.reply(donateErrMsg);
						} else {
//record donation
							queryString = 'INSERT INTO "materialList" values(\''+ctx.message.from.id+'\',\''+ctx.message.from.first_name+'\',\''+counterId+'\','+delta+',\'donate'+'\','+yyyy+','+mm+','+dd+')';

							pool.query(queryString, function(err1,res1) {
								if(err1){
									throw err1;
								}
							});
//bot reply with the right amount.
							queryString = 'select sum(CASE WHEN "materialList"."materialName" = \'google\' AND "materialList"."materialAction" = \'donate\' THEN "materialList"."materialAmount" ELSE 0 END) as materialActiontotal FROM public."materialList"';

							pool.query(queryString, function(err2,res2) {
								if(err){
									throw err;
								}
								ctx.reply("[googles donated] " + res2.rows[0].materialactiontotal + ", [googles remaining] " + (res.rows[0].materialactiontotal - res2.rows[0].materialactiontotal));
							});			

						}
						
				});
		}		
	} else {
		ctx.reply(incNMsg);
	}
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

		if (delta < 0) {
				ctx.reply(`Please enter positive numbers, e.g. /donatemask 5.`);
		} else {
//make sure the donation amount is more than stock
				queryString = 'select sum(CASE WHEN "materialList"."materialName" = \'mask\' AND "materialList"."materialAction" = \'inc\' THEN "materialList"."materialAmount" ELSE 0 END) as materialActiontotal FROM public."materialList"';

				pool.query(queryString, function(err,res) {
						if(err){
							throw err;
						}
						if((delta - res.rows[0].materialactiontotal) >0){
							ctx.reply(donateErrMsg);
						} else {
//record donation
							queryString = 'INSERT INTO "materialList" values(\''+ctx.message.from.id+'\',\''+ctx.message.from.first_name+'\',\''+counterId+'\','+delta+',\'donate'+'\','+yyyy+','+mm+','+dd+')';

							pool.query(queryString, function(err1,res1) {
								if(err1){
									throw err1;
								}
							});
//bot reply with the right amount.
							queryString = 'select sum(CASE WHEN "materialList"."materialName" = \'mask\' AND "materialList"."materialAction" = \'donate\' THEN "materialList"."materialAmount" ELSE 0 END) as materialActiontotal FROM public."materialList"';

							pool.query(queryString, function(err2,res2) {
								if(err){
									throw err;
								}
								ctx.reply("[masks donated] " + res2.rows[0].materialactiontotal + ", [masks remaining] " + (res.rows[0].materialactiontotal - res2.rows[0].materialactiontotal));
							});			

						}
						
				});
		};		
	} else {
		ctx.reply(incNMsg);
	}
	
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

		if (delta < 0) {
				ctx.reply(`Please enter positive numbers, e.g. /donatefilter 5.`);
		} else {
//make sure the donation amount is more than stock
				queryString = 'select sum(CASE WHEN "materialList"."materialName" = \'filter\' AND "materialList"."materialAction" = \'inc\' THEN "materialList"."materialAmount" ELSE 0 END) as materialActiontotal FROM public."materialList"';

				pool.query(queryString, function(err,res) {
						if(err){
							throw err;
						}
						if((delta - res.rows[0].materialactiontotal) >0){
							ctx.reply(donateErrMsg);
						} else {
//record donation
							queryString = 'INSERT INTO "materialList" values(\''+ctx.message.from.id+'\',\''+ctx.message.from.first_name+'\',\''+counterId+'\','+delta+',\'donate'+'\','+yyyy+','+mm+','+dd+')';

							pool.query(queryString, function(err1,res1) {
								if(err1){
									throw err1;
								}
							});
//bot reply with the right amount.
							queryString = 'select sum(CASE WHEN "materialList"."materialName" = \'filter\' AND "materialList"."materialAction" = \'donate\' THEN "materialList"."materialAmount" ELSE 0 END) as materialActiontotal FROM public."materialList"';

							pool.query(queryString, function(err2,res2) {
								if(err){
									throw err;
								}
								ctx.reply("[filters donated] " + res2.rows[0].materialactiontotal + ", [filters remaining] " + (res.rows[0].materialactiontotal - res2.rows[0].materialactiontotal));
							});			

						}
						
				});
		};		
	} else {
		ctx.reply(incNMsg);
	}
});

bot.startPolling();


module.exports = {

}
