#include "SigFox.h"

String intData = "";
int delimiter = (int) '\n';

volatile bool hasLocation = false;

String location;

void setup() {
  Serial.begin(9600);

  if (!SigFox.begin()) {
    Serial.println("SigFox error");
    return;
  }

  SigFox.end();


  SigFox.debug();
}

void loop() {
  SigFox.begin();
  delay(100);

  while (Serial.available()) {
    int ch = Serial.read();
    if (ch == -1) {
      // Handle error
    } else if (ch == delimiter) {
      break;
    } else {
      intData += (char) ch;
    }
  }

  Serial.println(intData);

  if (intData.length() == 12) {
    Serial.println("Got location");
    location = intData;
    hasLocation = true;
    intData = "";
  }

  delay(500);

  if (hasLocation) {
    Serial.println("Should send message");
    Serial.println(location);
    Serial.println(sizeof location);
    SigFox.status();
    delay(1);

    SigFox.beginPacket();
    SigFox.print(location);

    int result = SigFox.endPacket();

    if (result == 0) {
      Serial.println("Message sent !!!");
    } else {
      Serial.println("Error sending message");
    }

    SigFox.end();
    delay(660000);
  }


}