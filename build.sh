#!/bin/sh
set -x

docker build --network host . -t registry-intl.cn-hongkong.aliyuncs.com/acewebgames/trans-server:latest
