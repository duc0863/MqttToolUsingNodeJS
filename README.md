/*******************************************************************************/
 *
 * Description: Tool listen heartbeat from mqtt broker
 *
 * Project name: CHECKLOGMQTT_BYDUCVM
 *
 *
 * Last Changed By:  $Author: Vu Minh Duc (ducvm4802) $
 * Last Changed:     $Date: 05/07/2024 $
 *
 /******************************************************************************/

- Prerequisite: NodeJS
- Package:
    npm install mqtt
    npm install luxon
    npm install xlsx 
    npm install socket.io 
    npm install express 
    npm install http
    npm install fs
    npm install path
 /******************************************************************************/

 go to MQTT configurations and modify IP address & topic

 /******************************************************************************/

<h2> HB contain clusterId  and attributeId </h2>
ex: clusterId = 0x0000 and attributeId = 0x0001
go to client.on() in toolHB.js, modify the specified clusterId and attributeId
in terminal, run: node toolHB.js

 /******************************************************************************/

<h2> HB contain clusterId  and commandID </h2>
ex: clusterId = 0x0000 and commandID = 0x0A
go to client.on() in toolCMD.js, modify the specified clusterId and commandID
in terminal, run: node toolCMD.js

 /******************************************************************************/

<h2> HB contain eui64 </h2>
go to client.on() in GetAllMsgByEui.js, modify the List of eui 
in terminal, run: node GetAllMsgByEui.js

 /******************************************************************************/

<h2> Get Command zcl on-off on and zcl on-off off </h2>
topic: gw/+/commands
run: node ZclOnOff.js

 /******************************************************************************/

output is located in Log folder 

```
check output on website (local host)
    open browser: http://localhost:3000/
    You can filter messages by Eui, Time or both

    Warning: You should check output on website when the program ended.
    When using filters, Invalid message will not be displayed on the website, let check it in Log folder.
```


 /******************************************************************************/

 Tool_Publish_Message folder: for testing process

 /******************************************************************************/

 To modify 
