FROM node:lts

RUN mkdir /deapl
RUN apt update && apt-get install chromium -y && npm install -g ts-node
RUN adduser --disabled-password --disabled-login puppeteer
WORKDIR /deapl
RUN chown -R puppeteer:puppeteer /deapl
RUN echo 'kernel.unprivileged_userns_clone=1' > /etc/sysctl.d/userns.conf

# Prevent sandboxing from being required
USER puppeteer

ADD ./src .
ADD ./package.json .

RUN npm install 

CMD ["ts-node","--swc","./server.ts"]