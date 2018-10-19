var https = require('https')

exports.handler = (event, context) => {

  try {

    if (event.session.new) {
      // New Session
      console.log("NEW SESSION")
    }
    
    switch (event.request.type) {

      case "LaunchRequest":
        // Launch Request
        console.log(`LAUNCH REQUEST`)
        context.succeed(
          generateResponse(
            buildSpeechletResponse("Welcome to Urban Dictionary", true),
            {}
          )
        )
        break;

      case "IntentRequest":
        // Intent Request
        console.log(`INTENT REQUEST`)

        switch(event.request.intent.name) {
            case "LaunchRequest":
                context.succeed(
                    generateResponse(
                        buildSpeechletResponse("Awright, guv'nor", true),
                        {}
                    )
                )
                break;
            case "AskAbout":
                var queryWord = event.request.intent.slots.word.value
                var endpoint = "https://api.urbandictionary.com/v0/define?term=" +  queryWord
                var body = ""
                https.get(endpoint, (response) => {
                  response.on('data', (chunk) => { body += chunk })
                  response.on('end', () => {
                    var data = JSON.parse(body)
                    var definition = data.list[0].definition.replace(/\\r\\n/g,"")
                    context.succeed(
                      generateResponse(
                        buildSpeechletResponse(definition, true),
                        { //Session attributes
                            "all_definitions" : data.list,
                            "def_index" : 0
                        }
                      )
                    )
                  })
                })
                break;
            case "NextIntent":
                var index = event.session.attributes.def_index
                var definitions = event.session.attributes.all_definitions
                if (index >= definitions.length) {
                    //Run out of definitions
                    context.succeed(
                        generateResponse(
                            buildSpeechletResponse("I'm sorry, I'm all out of definitions."),
                            {}
                        )
                    )
                } else {
                    index++;
                    context.succeed(
                        generateResponse(
                            buildSpeechletResponse(definitions[index].definition.replace(/\\r\\n/g,"")),
                            {
                                "all_definitions" : definitions,
                                "def_index" : index
                            }
                        )
                    )
                }
                break;
            case "InASentence":
                var index = event.session.attributes.def_index
                var definitions = event.session.attributes.all_definitions
                context.succeed(
                    generateResponse(
                        buildSpeechletResponse(definitions[index].example.replace(/\\r\\n/g,"")),
                            event.session.attributes
                    )
                )
                break;
          

          default:
            console.log(event.request.intent.name)
            throw "Invalid intent"
        }

        break;

      case "SessionEndedRequest":
        // Session Ended Request
        console.log(`SESSION ENDED REQUEST`)
        break;

      default:
        context.fail(`INVALID REQUEST TYPE: ${event.request.type}`)

    }

  } catch(error) { context.fail(`Exception: ${error}`) }

}

// Helpers
buildSpeechletResponse = (outputText, shouldEndSession) => {

  return {
    outputSpeech: {
      type: "PlainText",
      text: outputText
    },
    shouldEndSession: shouldEndSession
  }

}

generateResponse = (speechletResponse, sessionAttributes) => {

  return {
    version: "1.0",
    sessionAttributes: sessionAttributes,
    response: speechletResponse
  }

}
