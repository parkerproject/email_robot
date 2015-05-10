require('dotenv').load();
var collections = ['fb_people', 'people', 'fb_ids'];
var db = require("mongojs").connect(process.env.MONGODB_URL, collections);
var swig = require('swig');
var _ = require('lodash');
var twitter = require('twitter');


var domain = 'indataly.com';
var mailgun = require('mailgun-js')({
    apiKey: process.env.MAILGUN_KEY,
    domain: domain
});


function saveEmail(data, reply) {
    db.early_access.save({
        email: data.email,
        referral: data.hash
    }, function(err, success) {
        console.log(success);
        if (err) reply('<span class="error">oops! looks like the server failed. Try again</span>');
        if (success) reply(1);
    });

}




function sendEmails(subject, content, emailArr, recipientVars) {

    var data = {
        from: 'Parker from INDATALY ' + process.env.SEND_FROM,
        to: emailArr,
        subject: subject,
        'recipient-variables': JSON.stringify(recipientVars),
        html: content
    };

    mailgun.messages().send(data, function(error, body) {
        console.log(body);
    });

}

function extractFacebookId(docsObj) {
    var fb_str = _.pluck(docsObj, 'http://www.facebook.com/profile.php?id=881225656');
    var fb_id = fb_str[0].split('?');
    var str = fb_id[fb_id.length - 1];
    var clean_id = str.replace("id=", "");

    return clean_id;
}



module.exports = {

    robot: {
        handler: function(request, reply) {

            db.people.find({}).limit(1, function(err, docs) {
                var subject = '$5/Mo SEO Toolbox Early Access!';
                var email, name;
                var emails = docs[0].list;
                var breakEmail = _.chunk(emails, 18); // 14400/800
                var firstRecord = breakEmail[0]; // remember to adjust this to next group ( each contains 800 emails)

                var emailArr = firstRecord;

                var userName = 'Friend';

                var recipientVars = emailArr.reduce(function(obj, k) {
                    obj[k] = {
                        first: userName,
                        id: k
                    };
                    return obj;
                }, {});


                swig.renderFile(__base + 'server/views/guest_post.html', {
                        name: userName
                    },
                    function(err, content) {
                        if (err) {
                            throw err;
                        }
                        if (emailArr.length != 0) {
                            sendEmails(subject, content, emailArr, recipientVars);
                        }

                        reply('sending....');

                    });

            });

        },
        app: {
            name: 'guestEmail'
        }
    }

};