# CRAWLER2

## Description

Development Server Ubuntu 20.04

## Specification
10.0.2.51/16  
user: stlouisa

## INSTALLATION

1.0 Install docker  

> sudo apt install docker  

1. Pull Docker Node

Download node docker image

> sudo docker pull node

Install NPM

> sudo npm install -g puppeteer --unsafe-perm=true -allow-root && sudo apt install chromium-browser -y

Install Puppeteer dependencies

> sudo apt update && sudo apt install -y gconf-service libgbm-dev libasound2 libatk1.0-0 libc6 libcairo2 libcups2 libdbus-1-3 libexpat1 libfontconfig1 libgcc1 libgconf-2-4 libgdk-pixbuf2.0-0 libglib2.0-0 libgtk-3-0 libnspr4 libpango-1.0-0 libpangocairo-1.0-0 libstdc++6 libx11-6 libx11-xcb1 libxcb1 libxcomposite1 libxcursor1 libxdamage1 libxext6 libxfixes3 libxi6 libxrandr2 libxrender1 libxss1 libxtst6 ca-certificates fonts-liberation libappindicator1 libnss3 lsb-release xdg-utils wget

Install puppeteer

> npm i puppeteer  
> npm i puppeteer-core

Install Visual Code

Update the packages index and install the dependencies by running the following command as a user with sudo privileges :

> sudo apt update  
> sudo apt install software-properties-common apt-transport-https wget

Update the packages index and install the dependencies by running the following command as a user with sudo privileges:  
> wget -q https://packages.microsoft.com/keys/microsoft.asc -O- | sudo apt-key add -

Import the Microsoft GPG key using the following wget command :

> wget -q https://packages.microsoft.com/keys/microsoft.asc -O- | sudo apt-key add -

And enable the Visual Studio Code repository by typing:

> sudo add-apt-repository "deb [arch=amd64] https://packages.microsoft.com/repos/vscode stable main"  

Once the apt repository is enabled , install the Visual Studio Code package:

> sudo apt install code

When a new version is released you can update the Visual Studio Code package through your desktop standard Software Update tool or by running the following commands in your terminal:

> sudo apt update  
> sudo apt upgrade  

Once the apt repository is enabled , install the Visual Studio Code package:  

> sudo apt install code




