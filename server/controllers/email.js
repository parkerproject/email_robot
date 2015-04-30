require('dotenv').load();
var collections = ['bloggers'];
var db = require("mongojs").connect(process.env.DEALSBOX_MONGODB_URL, collections);
var swig = require('swig');
var rp = require('request-promise');
var mandrill = require('node-mandrill')(process.env.MANDRILL);
var _ = require('lodash');

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

function sendEmails(email, subject, content) {
  mandrill('/messages/send', {
    message: {
      to: [{
        email: email
      }],
      from_email: 'frank@indataly.com',
      from_name: 'Frank from INDATALY',
      subject: subject,
      html: content
    }
  }, function(error, response) {
    //uh oh, there was an error
    if (error) console.log(JSON.stringify(error));

    //everything's good, lets see what mandrill said
    else console.log(response);
  });
}



module.exports = {
  storeEmail: {
    handler: function(request, reply) {
      var user = request.params.email;
      var email = user.split('/')[0];
      var hash = user.split('/')[1];

      db.people.findOne({
        email: email
      }, function(err, result) {
        if (err) console.log(err);
        if (result) {
          reply('You have already submitted your email.');
        } else {
          saveEmail({
            email: email,
            hash: hash
          }, reply);
        }
      });


    },
    app: {
      name: 'storeEmail'
    }
  },

  welcomeEmail: {
    handler: function(request, reply) {
      var user = request.params.user;
      var email = user.split('/')[0];
      var name = user.split('/')[1];
      var subject = 'Welcome to Dealsbox';

      swig.renderFile(__base + 'server/views/welcome_email.html', {
          name: name
        },
        function(err, content) {
          if (err) {
            throw err;
          }
          sendEmails(email, subject, content);
          reply('Email sent');
        });


    },
    app: {
      name: 'welcomeEmail'
    }
  },

  robot: {
    handler: function(request, reply) {

      db.bloggers.find(function(err, docs) {
        var subject = 'You are invited to INDATALY';
        var email, name;

        for (var i = 0, len = docs.length; i < len; i++) {

          email = docs[i]['EMAIL ADD'];
          name = docs[i]['FIRST NAME'];


          (function(userEmail, userName) {


            swig.renderFile(__base + 'server/views/guest_post.html', {
                name: userName
              },
              function(err, content) {
                if (err) {
                  throw err;
                }

                sendEmails(userEmail, subject, content);

              });

          }(email, name));
        }

        reply('email sending...');

      });




    },
    app: {
      name: 'guestEmail'
    }
  }

};