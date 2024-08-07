
const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const bodyParser = require('body-parser');
const axios = require('axios');
const express = require('express');
const app = express();
const port = 8099;

const qrcode = require('qrcode-terminal');
 client = new Client({
        authStrategy: new LocalAuth(),
        puppeteer: {
            headless: true,
            args: [ '--no-sandbox', '--disable-gpu', ],
        }
    });

client.initialize();
client.on('loading_screen', (percent, message) => {
    console.log('Waiting For Connection WhatsApp.Web ?', percent, message);
  
});

client.on('qr', (qr) => {
    console.log('QR RECEIVED', qr);
    qrcode.generate(qr, { small: true });
});

client.on('authenticated', () => {
    console.log('AUTHENTICATED');
});
client.on('auth_failure', msg => {
    console.error('AUTHENTICATION FAILURE', msg);
});
client.on('ready', async () => {
const version = await client.getWWebVersion();
    console.log(`WWeb v${version}`);
    console.log('READY');
    const number = "+6281292500652";// Ubah menjad Nomor hp yang akan dikirim pesan
    const text = "Bot Sudah siap!";/// Pesan Yang akan dikirim
    const chatId = number.substring(1) + "@c.us";

});

client.on('message', async msg => {
    console.log('MESSAGE RECEIVED', msg.body);
    if (msg.body.includes("TAG")) {
        const tagParts = msg.body.split('-');
        //const tagNumber = tagParts[1];
        //console.log("Tag Number:", msg.body);
        const numbertelpon = msg.from;
        const nomertujuan = numbertelpon.replace('@c.us', '');
        // const nomertujuan = '+'.concat(cleanedPhoneNumber);
        console.log(nomertujuan);
        const postDataTag = {
            tag_number: msg.body,
            nomer: nomertujuan
        };
        axios.post('http://localhost/test/erp.php', JSON.stringify(postDataTag), {
            headers: {
                'Content-Type': 'application/json'
            }
        })
            .then(response => {
                console.log('Send Text Response:', response.data);
            })
            .catch(error => {
                console.error('Send Media Error:', error);
            });
        //console.log(postDataTag);


    } else {
        if (msg.body === '!ping reply') {
            // Send a new message as a reply to the current one
            msg.reply('pong');

        } else if (msg.body === '!ping') {
            // Send a new message to the same chat
            client.sendMessage(msg.from, 'pong');
        }
        else if (msg.body === '#inventory' || msg.body === '1') {
            // Download File ke Server
            axios.get('http://192.168.1.203:3333/download')
                .then(response => {
                    console.log('Download Response:', response.data);

                    // Send a new message to the same chat after downloading
                    const numbertelpon = msg.from;
                    const cleanedPhoneNumber = numbertelpon.replace('@c.us', '');
                    const nomertujuan = '+'.concat(cleanedPhoneNumber);
                    const currentDate = new Date();
                    const year = currentDate.getFullYear();
                    const month = String(currentDate.getMonth() + 1).padStart(2, '0');
                    const day = String(currentDate.getDate()).padStart(2, '0');
                    const fileName = `Inventory OK Unbooked${year}-${month}-${day}.pdf`;
                    const postData = {
                        number: nomertujuan,
                        mediaType: "pdf",
                        caption: `[ _File Inventory ${year}-${month}-${day}_ ]`,
                        file_document: `https://3628-43-247-13-65.ngrok-free.app/file_wa/${fileName}`
                    };

                    // Wait for 5 seconds before sending media
                    setTimeout(() => {
                        axios.post('http://localhost:8099/send-media', postData)
                            .then(response => {
                                console.log('Send Media Response:', response.data);
                                console.log('Post Data:', postData);
                            })
                            .catch(error => {
                                console.error('Send Media Error:', error);
                            });
                    }, 5000);
                })
                .catch(downloadError => {
                    console.error('Download Error:', downloadError);
                });


        } else if (msg.body.startsWith('!sendto ')) {
            // Direct send a new message to specific id
            let number = msg.body.split(' ')[1];
            let messageIndex = msg.body.indexOf(number) + number.length;
            let message = msg.body.slice(messageIndex, msg.body.length);
            number = number.includes('@c.us') ? number : `${number}@c.us`;
            let chat = await msg.getChat();
            chat.sendSeen();
            client.sendMessage(number, message);

        } else if (msg.body.startsWith('!subject ')) {
            // Change the group subject
            let chat = await msg.getChat();
            if (chat.isGroup) {
                let newSubject = msg.body.slice(9);
                chat.setSubject(newSubject);
            } else {
                msg.reply('This command can only be used in a group!');
            }
        } else if (msg.body.startsWith('!echo ')) {
            // Replies with the same message
            msg.reply(msg.body.slice(6));
        } else if (msg.body.startsWith('!desc ')) {
            // Change the group description
            let chat = await msg.getChat();
            if (chat.isGroup) {
                let newDescription = msg.body.slice(6);
                chat.setDescription(newDescription);
            } else {
                msg.reply('This command can only be used in a group!');
            }
        } else if (msg.body === '!leave') {
            // Leave the group
            let chat = await msg.getChat();
            if (chat.isGroup) {
                chat.leave();
            } else {
                msg.reply('This command can only be used in a group!');
            }
        } else if (msg.body.startsWith('!join ')) {
            const inviteCode = msg.body.split(' ')[1];
            try {
                await client.acceptInvite(inviteCode);
                msg.reply('Joined the group!');
            } catch (e) {
                msg.reply('That invite code seems to be invalid.');
            }
        } else if (msg.body === '!groupinfo') {
            let chat = await msg.getChat();
            if (chat.isGroup) {
                msg.reply(`
                *Group Details*
                Name: ${chat.name}
                Description: ${chat.description}
                Created At: ${chat.createdAt.toString()}
                Created By: ${chat.owner.user}
                Participant count: ${chat.participants.length}
            `);
            } else {
                msg.reply('This command can only be used in a group!');
            }
        } else if (msg.body === '!chats') {
            const chats = await client.getChats();
            client.sendMessage(msg.from, `The bot has ${chats.length} chats open.`);
        } else if (msg.body === '!info') {
            let info = client.info;
            client.sendMessage(msg.from, `
            *Connection info*
            User name: ${info.pushname}
            My number: ${info.wid.user}
            Platform: ${info.platform}
        `);
        } else if (msg.body === '!mediainfo' && msg.hasMedia) {
            const attachmentData = await msg.downloadMedia();
            msg.reply(`
            *Media info*
            MimeType: ${attachmentData.mimetype}
            Filename: ${attachmentData.filename}
            Data (length): ${attachmentData.data.length}
        `);
        } else if (msg.body === '!quoteinfo' && msg.hasQuotedMsg) {
            const quotedMsg = await msg.getQuotedMessage();

            quotedMsg.reply(`
            ID: ${quotedMsg.id._serialized}
            Type: ${quotedMsg.type}
            Author: ${quotedMsg.author || quotedMsg.from}
            Timestamp: ${quotedMsg.timestamp}
            Has Media? ${quotedMsg.hasMedia}
        `);
        } else if (msg.body === '!resendmedia' && msg.hasQuotedMsg) {
            const quotedMsg = await msg.getQuotedMessage();
            if (quotedMsg.hasMedia) {
                const attachmentData = await quotedMsg.downloadMedia();
                client.sendMessage(msg.from, attachmentData, { caption: 'Here\'s your requested media.' });
            }
        } else if (msg.body === '!location') {
            msg.reply(new Location(37.422, -122.084, 'Googleplex\nGoogle Headquarters'));
        } else if (msg.location) {
            msg.reply(msg.location);
        } else if (msg.body.startsWith('!status ')) {
            const newStatus = msg.body.split(' ')[1];
            await client.setStatus(newStatus);
            msg.reply(`Status was updated to *${newStatus}*`);
        } else if (msg.body === '!mention') {
            const contact = await msg.getContact();
            const chat = await msg.getChat();
            chat.sendMessage(`Hi @${contact.number}!`, {
                mentions: [contact]
            });
        } else if (msg.body === '!delete') {
            if (msg.hasQuotedMsg) {
                const quotedMsg = await msg.getQuotedMessage();
                if (quotedMsg.fromMe) {
                    quotedMsg.delete(true);
                } else {
                    msg.reply('I can only delete my own messages');
                }
            }
        } else if (msg.body === '!pin') {
            const chat = await msg.getChat();
            await chat.pin();
        } else if (msg.body === '!archive') {
            const chat = await msg.getChat();
            await chat.archive();
        } else if (msg.body === '!mute') {
            const chat = await msg.getChat();
            // mute the chat for 20 seconds
            const unmuteDate = new Date();
            unmuteDate.setSeconds(unmuteDate.getSeconds() + 20);
            await chat.mute(unmuteDate);
        } else if (msg.body === '!typing') {
            const chat = await msg.getChat();
            // simulates typing in the chat
            chat.sendStateTyping();
        } else if (msg.body === '!recording') {
            const chat = await msg.getChat();
            // simulates recording audio in the chat
            chat.sendStateRecording();
        } else if (msg.body === '!clearstate') {
            const chat = await msg.getChat();
            // stops typing or recording in the chat
            chat.clearState();
        } else if (msg.body === '!jumpto') {
            if (msg.hasQuotedMsg) {
                const quotedMsg = await msg.getQuotedMessage();
                client.interface.openChatWindowAt(quotedMsg.id._serialized);
            }
        } else if (msg.body === '!buttons') {
            let button = new Buttons('Button body', [{ body: 'bt1' }, { body: 'bt2' }, { body: 'bt3' }], 'title', 'footer');
            client.sendMessage(msg.from, button);
        } else if (msg.body === '!list') {
            let sections = [{ title: 'sectionTitle', rows: [{ title: 'ListItem1', description: 'desc' }, { title: 'ListItem2' }] }];
            let list = new List('List body', 'btnText', sections, 'Title', 'footer');
            client.sendMessage(msg.from, list);
        } else if (msg.body === '!reaction') {
            msg.react('👍');
        } else if (msg.body === '!edit') {
            if (msg.hasQuotedMsg) {
                const quotedMsg = await msg.getQuotedMessage();
                if (quotedMsg.fromMe) {
                    quotedMsg.edit(msg.body.replace('!edit', ''));
                } else {
                    msg.reply('I can only edit my own messages');
                }
            }
        } else if (msg.body === '!updatelabels') {
            const chat = await msg.getChat();
            await chat.changeLabels([0, 1]);
        } else if (msg.body === '!addlabels') {
            const chat = await msg.getChat();
            let labels = (await chat.getLabels()).map(l => l.id);
            labels.push('0');
            labels.push('1');
            await chat.changeLabels(labels);
        } else if (msg.body === '!removelabels') {
            const chat = await msg.getChat();
            await chat.changeLabels([]);
        }
    }
});
// Menggunakan body-parser middleware untuk membaca data dari body JSON
app.use(bodyParser.json());

app.post('/send-message', (req, res) => {
    const { number, text } = req.body;
    // Cek apakah nomor dan teks ada dalam body permintaan
    if (!number || !text) {
        return res.status(400).json({ success: false, message: "Nomor dan teks harus disertakan dalam body JSON" });
    }
    const chatId = number.substring(1) + "@c.us";
    // Kirim Pesan.
    client.sendMessage(chatId, text)
        .then(() => {
            res.status(200).json({ success: true, message: "Pesan berhasil dikirim!", id:chatId });
        })
        .catch((error) => {
            res.status(500).json({ success: false, message: "Gagal mengirim pesan", error: error.message });
        });
});

app.post('/send-group', (req, res) => {
    const { groupId, text } = req.body;
    // Cek apakah groupId dan teks ada dalam body permintaan
    if (!groupId || !text) {
        return res.status(400).json({ success: false, message: "groupId dan teks harus disertakan dalam body JSON" });
    }

    // Kirim Pesan.
    client.sendMessage(groupId, text)
        .then(() => {
            res.status(200).json({ success: true, message: "Pesan berhasil dikirim!" });
        })
        .catch((error) => {
            res.status(500).json({ success: false, message: "Gagal mengirim pesan", error: error.message });
        });
});
app.post('/send-media', async (req, res) => {
    const { number, mediaType, caption, file_document } = req.body;
    // Cek apakah nomor dan jenis media ada dalam body permintaan
    if (!number || !mediaType || !file_document) {
        return res.status(400).json({ success: false, message: "Nomor dan media harus disertakan dalam body JSON" });
    }
    const chatId = number.substring(1) + "@c.us";
    // Tentukan URL atau path ke file media berdasarkan jenis media yang dikirim
    const media = await MessageMedia.fromUrl(file_document);
    //membalas dengan media
    client.sendMessage(chatId, media, {
        caption: caption,
    })
        .then(() => {
            res.status(200).json({ success: true, message: "Media berhasil dikirim!" });
        })
        .catch((error) => {
            res.status(500).json({ success: false, message: "Gagal mengirim media", error: error.message });
        });
});

app.listen(port, () => {
    console.log(`Server berjalan di http://localhost:${port}`);
});
