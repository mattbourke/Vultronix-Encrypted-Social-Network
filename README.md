>A product of the brain of Matt Bourke, coded 2013/14/15 by [Matt Bourke](https://github.com/mattbourke) and [David White](https://github.com/cfjquery) - for freedom and liberty online, an end to end centralised encrypted network.

  * PGP: 3DB6 FF02 6EBA 6AFF 63AF 2B6E DCE5 3FA2 EC58 63D8
  * Bitcoin: 18FNZPvYeWUNLmnS6bQyJSVXYPJ87cssMM
  * TOR: http://xvultx4llltx7w2d.onion

# Vultronix - *pre-alpha stage*.
A TOR first, client side encrypted social network.  
What? Why? How? read: [This Reddit Onions Post](https://www.reddit.com/r/onions/comments/5qtbi9/xvultx4llltx7w2donion_is_18_months_online_today/)

# TL;DR.
  * All user data is encrypted client side
  * Vultronix has no access to any user data, Vultronix doesn't even know how many friends a user has.
  * Vultronix does not even know the user's login name.
  * Vultronix doesn't even have access to public keys, this will help the user remain more quantum resistant.
  * Vultronix hosts all files and does not use a CDN, this is to protect the user's privacy.
  * All images a user uploads are encrypted client side before upload.
  * All Javascript is served directly from our servers and signed.  Going forward a hash of each JS release will be published here and on https://twitter.com/TheVultronix , we'll also sign the hash with our PGP key. Note: following our twitter account may reduce your privacy.

# The application runs on the following stack.
  * TOR
  * NGINX
  * Linux
  * NodeJS
  * Memcached
  * SocketIO
  * Angular 1.5x
  * Express

## Vultronix uses the following encryption and hashing algorithms to protect user data.

  * RSA - for either TOR encryption, or clearnet HTTPS.
  * AES - each friendship has it's own unique Symetric key, as well as using Asymetric keys.
  * PGP 4096bit - each friendship will privately share PGP pub/priv keys with one another, however the public keys are never revealed to anyone else, except the holders of the friendship's Symetric key.
  * SHA-512 - all key passwords are SHA-512, the input has less bits of entropy than the Hash is capable, the input is generally a contactenation of 2+ concatenated UUIDs created via the Web Cryptography API RNG + a concatenated user generated input.  With some parts of the code, the user input is another SHA generated in similar fashion, while in other places the user input is manual text entered.  All hashes are then key stretched by hashing forward 5001 times.  A more technical user could easily create a login key containing just as much entropy as the SHA-512 algorithm can handle.
  * SHA-256 - when generating friendship and group invitation codes, the final hash is a SHA-256 of a SHA-512, this allows for a more user friendly, easy to copy invitation code.


  (NOTE: All key stretching uses a mix of both the SHA-512 and SHA-256 algorithm by switching between the two at different steps of the stretching.  The SHA-256 is faster on 32 bit machines and the SHA-512 is faster on 64 bit machines, this version switching should just slow things down a very small bit.  )


# Install instructions
  * Install NodeJS
  * Download the TOR Browser (You don't need TOR or NGINX for local development).
  * Install Memcached
  * Pull down this repository
  * npm install


# Windows users....
In cmd.exe navigate to *C:\Program Files\MongoDB 2.6 Standard\bin* then run the following

* mongod --dbpath c:\mongo
* *if you're having problems adding items to the db, try deleting all files(not folders) in C:\mongo* you'll naturally lose all your db data
* *also in **command console** browse to the **mongo\bin** directory and run mongo.exe in the console, from there you can run scripts, type **show dbs** to see a list of databases, switch to the one you want with **use databaseName***

Install Memached server (if using windows) from https://commaster.net/content/installing-memcached-windows then install node memached client

* install it within C:\memcached
* Open CMD window as Administrator run as service with SC create memcached binpath= "c:\memcached\memcached.exe -m 512 -d"
* Check your task manage, it may be running
* if not working try looking at setup issues https://code.google.com/p/memcached/issues/detail?id=149

In cmd.exe navigate to your *vultronix* directory and run the following

* run vultronix.bat or run the below command.
* nodemon ./bin/www
* run rungulp.bat or run the below
* gulp watch

load this

* http://localhost:9000/


**Resources**

We are utilising the following resources that are already baked into the source code (please let us know of anything we forgot.) :-

* Theme                  - http://themekit.aws.ipv4.ro/dist/themes/social-3/user-private-profile.html
* Favicon                - http://realfavicongenerator.net/
* Lightbox               - https://github.com/compact/angular-bootstrap-lightbox
* ng-videosharing-embed  - https://github.com/erost/ng-videosharing-embed
* Lightbox, ng-videosharing-embed and Bootstrap Carousel are used for the feed images and videos.*
* OpenPGPjs - https://github.com/openpgpjs/openpgpjs
* Stanford Javascript Crypto Library - https://github.com/bitwiseshiftleft/sjcl

**Please contact us with any questions**
