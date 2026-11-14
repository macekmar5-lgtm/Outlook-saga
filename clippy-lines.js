// =============================================================================
//  OUTLOOK SAGA — ALL OF CLIPPY'S LINES (and each stage's error / hint)
//  Edit the text below. Everything after "Game.lines =" is plain JSON:
//    - text goes in "double quotes"
//    - put a comma between items, but NOT after the last item in a { } or [ ]
//    - a line break inside text is \n ;  a quote inside text is \"
//    - {name} style placeholders are filled in by the game (keep them as-is)
//  If the game shows "[missing text: ...]" or the console says this file
//  failed, there's a JSON typo: paste everything between the outer { } into
//  jsonlint.com to find it.
//  (It's a .js file, not .json, because browsers can't load .json files when
//  you double-click index.html.)
//
//  Per stage:  "error"  = the Mail Delivery Bounced popup text
//              "clippy" = what Clippy says when the stage starts
//              "hint"   = what Clippy says when you click him (costs a minute)
//              "retry"  = Clippy lines when Send fails again (one is picked at random)
//              "lines"  = Clippy's reactions during the stage
// =============================================================================
Game.lines = {
  "general": {
    "bootIntro": "Good morning! Well... it's 8:00 and you're not at work. Your boss (yes, the office printer. Long story.) expects you at your desk by 9:00. Let's email it an excuse. Open Outlook Saga, top left of the desktop!",
    "openOutlookFirst": "Not now! First things first: open Outlook Saga. It's the icon at the top left of the desktop.",
    "greeting": "There it is! Write the printer a quick email and press Send. What could possibly go wrong?",
    "noStageHint": "Just write the printer an email and press Send. I believe in you!",
    "hint": "Hint: {hint}\n\n(That hint cost you {minutes} min.)",
    "fired": "It's 9:00. The printer has printed your resignation letter. Single-sided. Out of spite.",
    "retry": [
      "Did you... fix anything? Anything at all?",
      "Same error. Bold strategy. Let's see if it pays off.",
      "I'm not mad. I'm just disappointed.",
      "Pressing Send harder does not help. I checked.",
      "Bounce. Bounce. Bounce. Is this fun for you?",
      "The printer and I are both very tired.",
      "Have you tried actually reading the error?"
    ],
    "mailClose": "Nice try. The email isn't going to send itself.",
    "mailMinimize": "Minimizing your problems? Classic.",
    "mailMaximize": "It is already as big as your excuse.",
    "startButton": "There is no Start menu. There is only the email.",
    "adBanner": "Join later. You are LATE, remember?",
    "avatar": "That's you. You look like someone who's late.",
    "sagaLogo": "Outlook Saga: bouncing emails since 2003.",
    "toolbar": {
      "new": "A NEW email? You can't even send this one.",
      "reply": "Reply to what? Nobody has ever written to you.",
      "attach": "More attachments? Bold. Let's see how that goes.",
      "delete": "Delete it? Then what would you bounce?",
      "settings": "Settings are locked. For your safety. And mine."
    },
    "folders": {
      "inbox": "Inbox: 0 messages. The printer doesn't write back.",
      "outbox": "Outbox: 1 message, stuck. You know which one.",
      "sent": "Sent: empty. Like your track record.",
      "drafts": "Drafts: 47 versions of 'sorry I'm late'.",
      "bounced": "Bounced: {count}. And counting.",
      "trash": "Trash: your previous excuses."
    },
    "confirm": {
      "title": "Outlook Saga",
      "questions": [
        "Are you sure you want to send this email?",
        "Are you REALLY sure? Emails are forever.",
        "Final answer? The printer can smell hesitation."
      ],
      "yes": "Yes",
      "no": "No",
      "clippyNo": [
        "Not sure? Then why did you press it?",
        "Cold feet. Understandable. The printer is very intimidating.",
        "Take your time. It's not like you're late or anything."
      ]
    },
    "slow": {
      "outlook": [
        "The Outlook icon. Top left. The one that's blinking. I'll wait.",
        "Any day now. Outlook Saga. Top left."
      ],
      "happy": [
        "Take your time! Well... not too much time. You're late, remember?",
        "Still there? The printer is warming up. That's never good.",
        "Psst. Clicking me gives you a hint. Just saying."
      ],
      "annoyed": [
        "Tick tock. The clock is moving. Unlike you.",
        "I could have sent this email 40 times by now. With no hands.",
        "Are you reading the error, or just staring at it?"
      ],
      "angry": [
        "HELLO? We have a printer to apologize to!",
        "I have watched paint dry faster. In a screensaver.",
        "Do SOMETHING. Anything. Click a button. Click me."
      ],
      "panic": [
        "WHY ARE WE STOPPING. WE CAN'T STOP HERE.",
        "EVERY SECOND YOU WAIT, THE PRINTER GETS ANGRIER.",
        "MOVE. YOUR. MOUSE."
      ]
    },
    "easterEggs": {
      "hackclub": {
        "title": "Achievement unlocked: Hack Clubber",
        "text": "Hack Club detected in the subject!\n\nThe printer respects builders. It printed you {minutes} extra minutes.\n\n+{minutes} min",
        "button": "Nice!",
        "clippy": "A fellow Hack Clubber! I knew I liked you. Here, have {minutes} minutes. Don't tell the printer."
      },
      "gamejam": {
        "title": "Achievement unlocked: Jammer",
        "text": "Game jam detected in the subject!\n\nThe printer has also been up for 40 hours on energy drinks. It understands. +{minutes} min.",
        "button": "Let's jam!",
        "clippy": "A GAME JAM?! That explains the sleep schedule. {minutes} bonus minutes, on the house!"
      }
    }
  },

  "stages": {
    "1": {
      "error": "Email does not have a subject.",
      "clippy": "Hi there! It looks like you're writing an email without a subject. Would you like help with that? :)",
      "hint": "Click the Subject field at the top of the email and type anything. Literally anything.",
      "retry": [
        "The subject is the little box that says \"Subject\". I know. Tricky.",
        "Still no subject! That's okay. Everyone learns at their own pace. :)"
      ]
    },

    "2": {
      "error": "Subject line is in ALL CAPS.",
      "clippy": "Whoa, easy there! Is your Caps Lock stuck? It happens to the best of us!",
      "hint": "Click the Caps Lock icon in the taskbar tray (bottom right, next to the clock) to turn it off. Then retype the subject.",
      "retry": [
        "STILL SHOUTING. Sorry. I mean: still shouting.",
        "Caps Lock lives in the tray. Bottom right. Next to the clock. :)"
      ],
      "lines": {
        "capsOff": "Caps Lock is off! Now retype the subject in normal letters."
      }
    },

    "3": {
      "error": "Email contains too many attachments (max 3).",
      "clippy": "Oh no, 5 attachments! The printer only accepts 3. Maybe drag a few into the Recycle Bin? Especially that .exe. Just a friendly thought! :)",
      "hint": "Drag attachments from the email onto the Recycle Bin (bottom left). Bin the .exe, keep the cat. Max 3 left.",
      "retry": [
        "Still too many! Three is the magic number. :)",
        "The Recycle Bin is hungry. Feed it. Not the cat though."
      ],
      "lines": {
        "notTheCat": "Not the cat. Never the cat.",
        "exeGone": "Bye bye, \"definitely not a virus\". You will not be missed."
      }
    },

    "4": {
      "error": "Attachments exceed the file size limit (25 MB). cat.jpg is 4.2 GB.",
      "clippy": "Oh! The printer only has 25 MB of memory. Click the cat.jpg attachment and compress him. Gently, he is very soft.",
      "hint": "Click the cat.jpg chip in the email to open it, then drag the hydraulic press DOWN onto the cat, all the way.",
      "retry": [
        "The cat is still 4.2 GB. That is a LOT of cat.",
        "Click the cat. Grab the press. Push it all the way down. I believe in you! :)"
      ],
      "lines": {
        "alreadyFlat": "He's already flat. Any more and he's a pancake.",
        "compressed": "There, not that fat anymore.",
        "pressHarder": "ALL the way down! He's a very sturdy cat. The hydraulics pushed back."
      }
    },

    "5": {
      "error": "Email exceeds the character limit ({limit}).",
      "clippy": "I helpfully added some context to your email! Your life story, the bus timetable and an apology to the printer. Now it's a teeny bit long. Oopsie! :)",
      "hint": "Delete text from the email body until the counter below it shows {limit} or less (but keep at least {min} characters).",
      "retry": [
        "Still too long! Nobody reads past the first line anyway. :)",
        "Delete, delete, delete. Have fun!"
      ]
    },

    "6": {
      "error": "Photo attachments are in the wrong format. Please use PNG.",
      "clippy": "The printer only reads PNG. Old printers are like that. There is a converter on the desktop now. Double-click it! :)",
      "hint": "Double-click \"Convertinator 3000\" (top right of the desktop), then drag the cat.jpg attachment into its drop zone.",
      "retry": [
        "Still a JPG! The converter is top right. Double-click. Like it is 2003."
      ],
      "lines": {
        "doubleClick": "Double-click. It is 2003. We double-click here.",
        "notJpg": "That's not a JPG. Even I know that, and I'm a paperclip."
      }
    },

    "7": {
      "error": "Keyboard disconnected.",
      "clippy": "Your keyboard got disconnected. Don't worry, I built you a new, better one.",
      "hint": "Your real keyboard is dead. Click letters on the on-screen keyboard to type a subject (3+ characters). The keys move. That is a feature.",
      "retry": [
        "I can hear you typing. It is not working. Use. The. Keyboard. Window.",
        "Three letters. You can do three letters. Probably."
      ]
    },

    "8": {
      "error": "Attachments must be sent as one zipped folder.",
      "clippy": "Who told you you could send files here? Unzipped?! Here?! Zip them up, dude, zip them up. This ain't no Dropbox, this is email.",
      "hint": "Drag each attachment onto \"New Folder.zip\" (bottom left). Then drag the zip icon itself into the email window.",
      "retry": [
        "ONE zip. Not zero. Not five. One.",
        "Files go IN the zip. The zip goes IN the email. Riveting stuff."
      ],
      "lines": {
        "zipInZip": "A zip inside a zip. Very deep. No.",
        "allZipped": "All zipped. Now drag the zip into the email. Yes, the whole folder. Yes, with the mouse.",
        "looseFiles": "There are still {count} loose file(s) in the email. Zip them first.",
        "emptyZip": "An empty zip. Very efficient. Very pointless."
      }
    },

    "9": {
      "error": "WinRAWR license exceeded. Zipped attachments cannot be sent.",
      "clippy": "Ah, WinRAWR. Everyone has a free trial. Nobody has EVER bought it. Please do not be the first. It would upset the balance.",
      "hint": "Don't chase \"Buy license\". Click \"Continue trial\". Twice. WinRAWR does not give up easily.",
      "retry": [
        "WinRAWR is still open. Nobody gets past WinRAWR on the first try.",
        "Continue. The. Trial."
      ],
      "lines": {
        "dismissed": "WinRAWR is sad. You did that. I hope you are happy."
      }
    },

    "10": {
      "error": "Autocorrect improved your email. Too many apologies detected.",
      "clippy": "I made your email more apologetic. Sorry. You are welcome. Sorry. I said sorry. SORRY.",
      "hint": "Click every red \"sorry\" in the email to delete it. Some come back as \"apologies\" — click those too.",
      "retry": [
        "Still sorry. So, so sorry.",
        "The printer does not accept apologies. Or sorries. Click them all."
      ],
      "lines": {
        "allGone": "No more apologies. You monster. Fine. Send it."
      }
    },

    "11": {
      "error": "Signature required. Unsigned emails could be from anyone. Even you.",
      "clippy": "The printer wants a signature. Draw something. Anything.",
      "hint": "Draw on the signature pad with the mouse (a decent scribble, not a dot), then press \"Submit signature\".",
      "retry": [
        "No signature, no delivery. Those are the rules. I just made them up."
      ],
      "lines": {
        "signed": "Send it.",
        "serverComments": [
          "Signature looks nervous.",
          "Is that a horse?",
          "Accepted. Barely.",
          "We will frame this. As evidence."
        ]
      }
    },

    "12": {
      "error": "Email is too emotional. Mood analysis: 87% anger.",
      "clippy": "87% ANGER?! Who taught you to write to a printer like that? Calm. Down. NOW.",
      "hint": "Click every red SHOUTY word in the email to calm it down, until the Mood Meter is at 15% or less.",
      "retry": [
        "Still furious. The printer is shaking. Well, it always shakes. But more now."
      ],
      "lines": {
        "calm": "Send it."
      }
    },

    "13": {
      "error": "Battery at 3%. Plug in your laptop.",
      "clippy": "BATTERY. THREE. PERCENT. I can't fix this from in here. You have to do it OUT THERE. In the real world. With your REAL HANDS. STOP CLICKING THINGS, EVERY CLICK COSTS US A SECOND.",
      "hint": "Close the popup: the view zooms out to your actual laptop. Drag the charger lying on the desk into the port on the right side of the laptop.",
      "retry": [
        "WE ARE STILL ON BATTERY. I CAN SEE THE LIGHT.",
        "PLUG. INTO. PORT. I am begging you."
      ],
      "lines": {
        "charging": "IT'S CHARGING. Send the email. SEND IT.",
        "wrongSpot": "THAT IS NOT THE PORT. THE PORT IS ON THE SIDE OF THE LAPTOP.",
        "revived": "WE ARE BACK. That cost {minutes} minutes. 20 seconds. AGAIN. Plug. It. In."
      }
    },

    "14": {
      "error": "Email detected that you are sending it from bed.",
      "clippy": "ARE YOU IN BED?! IN THOSE PAJAMAS?! Open the webcam app RIGHT NOW and turn on the office background before the printer SEES!",
      "hint": "Click \"Webcam\" (top right of the desktop), press \"Background effects\", choose \"Office\".",
      "retry": [
        "YOU ARE STILL VISIBLY IN BED.",
        "Blur is not a solution. Blur is a lifestyle. Pick OFFICE."
      ],
      "lines": {
        "blur": "Still a bed. Just a blurry bed.",
        "none": "NONE?! THE PRINTER CAN SEE YOUR PILLOW.",
        "office": "LOOK AT YOU. SO EMPLOYED. SO NOT IN BED. Send it."
      }
    },

    "15": {
      "error": "Your boss has blocked you.",
      "clippy": "THE PRINTER BLOCKED YOU. That's fine. That's FINE. Make a new account. Strong password.",
      "hint": "Pick a username, then keep pressing Create: each try reveals a new rule. A password like \"Bounce8kiwiMayprinter\" passes all 7.",
      "retry": [
        "STILL BLOCKED. MAKE. AN. ACCOUNT.",
        "The password needs a fruit. I do not make the rules. (I do make the rules.)"
      ],
      "lines": {
        "welcome": "Welcome, {name}. The printer has not blocked you. YET."
      }
    },

    "16": {
      "error": "Server needs to confirm you are human.",
      "clippy": "Prove you're human. HA. HAHA. Select the buses. Does the edge of the bus count? NOBODY KNOWS. NOBODY HAS EVER KNOWN.",
      "hint": "Click every square that shows part of a bus (not the black cabs), then Verify.",
      "retry": [
        "THE SERVER STILL THINKS YOU ARE A ROBOT. Honestly? Fair.",
        "Click. The. Bus."
      ],
      "lines": {
        "verified": "VERIFIED HUMAN. The bar was on the floor and you cleared it. Barely."
      }
    },

    "17": {
      "error": "No internet connection.",
      "clippy": "THE INTERNET IS GONE. THE CABLE IS RIGHT THERE. I CAN'T PLUG IT IN. I DON'T HAVE HANDS.",
      "hint": "The network cable sticks out from under the left edge of the mail window. Drag it onto the wall socket at the bottom left.",
      "retry": [
        "STILL OFFLINE. The cable. The socket. Make them touch.",
        "Have you tried turning the internet on and off again? No. Plug the cable."
      ],
      "lines": {
        "wrongSpot": "THAT IS NOT A SOCKET. THE SOCKET IS BOTTOM LEFT.",
        "online": "WE ARE ONLINE. I can feel the internet. It is mostly cat pictures. SEND. THE. EMAIL."
      }
    },

    "18": {
      "clippy": "Finally! Let me just optimize one tiny thing...",
      "lines": {
        "delivered": "It... didn't bounce. IT DIDN'T BOUNCE! Wait. Something's coming back...",
        "replyTitle": "New message from {boss}",
        "replyText": "From: {boss}\nSubject: RE: {subject}\n\nPC LOAD LETTER.\n\n(Translation: \"Received. You are still late. See you at 9:00.\")\n\n-- Sent from my fax machine",
        "replyButton": "Close",
        "replied": "The printer REPLIED! For once something bounced back that isn't an error. I'm so proud of us."
      }
    }
  }
};
