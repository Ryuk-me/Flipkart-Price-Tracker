const {
    Telegraf
} = require('telegraf')

require('dotenv').config()
const fs = require('fs')
const axios = require('axios')
const cheerio = require('cheerio')
const sleep = require('util').promisify(setTimeout)

var port = process.env.PORT || 8443;
var host = process.env.HOST;
const bot = new Telegraf(process.env.BOT_TOKEN,{webHook: {port: port, host: host}})

bot.start((ctx) => ctx.reply('Welcome To *Flipkart PriceTracker BOT*\nContact [@Ryuk_me](tg://user?id=545223894) for any query.\n_/help_ to see how to use', {
    parse_mode: 'Markdown'
}))

bot.help((ctx) => ctx.reply('_/start_ - Welcome Message\n_/pricetracker_ - To start *PriceTracker*\n_/add_ - To add url (always use command _/pricetracker_ after adding url)\n_/urls_ - To see all added Urls\n_/clear_ - To delete all urls', {
    parse_mode: 'Markdown'
}))

bot.hears('hi', (ctx) => ctx.reply('Hey there'))

bot.command('clear', async (ctx) => {
    const userID = ctx.chat.id;
    const userURLfile = userID + 'URL.txt';
    try {
        fs.unlinkSync(userURLfile)
        ctx.reply('_All urls deleted_', {
            parse_mode: 'Markdown'
        })

    } catch (err) {

        ctx.reply('_Already empty_', {
            parse_mode: 'Markdown'
        });
    }
})

bot.command('urls', async (ctx) => {
    const userID = ctx.chat.id;
    const userURLfile = userID + 'URL.txt';
    if (fs.existsSync(userURLfile)) {
        const links = fs.readFileSync(userURLfile, 'utf-8').toString().split("\n").filter(function (el) {
            return el != '';
        });
        return ctx.reply(links);
    } else {
        return ctx.reply('No url found', {
            parse_mode: 'Markdown'
        })
    }
})

bot.command('add', async (ctx) => {
    const userID = ctx.chat.id;
    const userURL = ctx.message.text.slice(5)

    const userURLfile = userID + 'URL.txt';
    if (fs.existsSync(userURLfile)) {
        if (userURL.startsWith('http') || userURL.startsWith('https')) {

            fs.appendFileSync(userURLfile, userURL + "\n", 'utf-8', (err, file) => {

            });
            ctx.reply('Link added Sucessfully', {
                parse_mode: 'Markdown'
            })
        } else {
            ctx.reply('Invalid URL', {
                parse_mode: 'Markdown'
            })
        }

    } else if (fs.existsSync(userURLfile) === false) {

        fs.open(userURLfile, 'w', (err, file) => {
            if (err) {
                ctx.reply('Some Error occurred', {
                    parse_mode: 'Markdown'
                });
            } else {
                if (userURL.startsWith('http') || userURL.startsWith('https')) {

                    fs.appendFileSync(userURLfile, userURL + "\n", 'utf-8', (err, file) => {});
                    ctx.reply('Link added Sucessfully', {
                        parse_mode: 'Markdown'
                    })
                } else {

                    ctx.reply('Invalid URL', {
                        parse_mode: 'Markdown'
                    })
                }

            }


        });
    }
})


bot.command('pricetracker', async (ctx) => {


    const userID = ctx.chat.id;
    const userURLfile = userID + 'URL.txt';


    ctx.reply('Checking for Price Change');

    var priceList = []
    async function fkNotifier() {

        if (fs.existsSync(userURLfile) === true) {
            while (true) {
                const links = fs.readFileSync(userURLfile, 'utf-8').toString().split("\n").filter(function (el) {
                    return el != '';
                });
                // console.log(links.length)
                if (links.length === 0) {

                    return ctx.reply('No link found /add to add link');
                }
                if (priceList.length < links.length) {
                    priceList = []
                }

                for (i = 0; i < links.length; i++) {
                    if (priceList.length === 0 || priceList.length < links.length) {

                        await sleep(60000)
                        const html = await axios.get(links[i]);
                        const $ = cheerio.load(html.data)

                        const Regexprice = parseInt($('div._1vC4OE._3qQ9m1').text().replace(/(₹|,)/gi, ''))

                        priceList.push(Regexprice);
                    } else {
                        await sleep(60000)
                        const html = await axios.get(links[i]);
                        const $ = cheerio.load(html.data)

                        const RegexpriceCurrent = parseInt($('div._1vC4OE._3qQ9m1').text().replace(/(₹|,)/gi, ''))
                        if (RegexpriceCurrent < priceList[i]) {

                            const title = $('span._35KyD6').text().toString()
                            const price = $('div._1vC4OE._3qQ9m1').text().toString() || ""
                            const stock = $("button._2AkmmA._2Npkh4._2kuvG8._7UHT_c").text().trim() || "NOTIFY ME"
                            let data = {
                                title: title,
                                price: price,
                                lastPrice: priceList[i],
                                stock: stock,
                                url: links[i]
                            }

                            ctx.reply(`Product : ${data['title']}\nCurrent Price : ${data['price']}\nLast Checked Price : ${data['lastPrice']}\nStock Status : ${data['stock']}\nUrl : ${data['url']}`);

                        }


                    }


                }

            }
        } else {
            ctx.reply('No link Available please add a link first by using command /add');
        }



    }

    fkNotifier()

})

bot.launch()
