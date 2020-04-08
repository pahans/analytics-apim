/*
 *  Copyright (c) 2020, WSO2 Inc. (http://www.wso2.org) All Rights Reserved.
 *
 *  WSO2 Inc. licenses this file to you under the Apache License,
 *  Version 2.0 (the "License"); you may not use this file except
 *  in compliance with the License.
 *  You may obtain a copy of the License at
 *
 *  http://www.apache.org/licenses/LICENSE-2.0
 *
 *  Unless required by applicable law or agreed to in writing,
 *  software distributed under the License is distributed on an
 *  "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 *  KIND, either express or implied.  See the License for the
 *  specific language governing permissions and limitations
 *  under the License.
 *
 */

/* eslint-disable react/jsx-filename-extension */
import React from 'react';
import { action } from '@storybook/addon-actions';
import { MuiThemeProvider, createMuiTheme } from '@material-ui/core/styles';
import APIMApiUsageSummaryWidget from '../src/APIMApiUsageSummaryWidget';

export default {
    component: APIMApiUsageSummaryWidget,
    title: 'APIMApiUsageSummaryWidget',
};

export const darkTheme = () => (
    <APIMApiUsageSummaryWidget
        muiTheme={{ name: 'dark' }}
        inProgress={false}
        widgetConf={{
            configs: {
                pubsub: {
                    types: ['subscriber'],
                },
                providerConfig: {
                    configs: {
                        config: {
                            siddhiApp: '',
                            queryData: {
                                query: '',
                            },
                            publishingInterval: 360000,
                        },
                    },
                },
            },
        }}
        getWidgetChannelManager={() => {
            return {
                unsubscribeWidget: () => { return Promise.resolve(''); },
                subscribeWidget: () => {
                    return Promise.resolve(null);
                },
            };
        }}
    />
);

export const lightTheme = () => (
    <MuiThemeProvider>
        <APIMApiUsageSummaryWidget
            muiTheme={{ name: 'light' }}
            inProgress={false}
            widgetConf={{
                configs: {
                    pubsub: {
                        types: ['subscriber'],
                    },
                    providerConfig: {
                        configs: {
                            config: {
                                siddhiApp: '',
                                queryData: {
                                    query: '',
                                },
                                publishingInterval: 360000,
                            },
                        },
                    },
                },
            }}
            getWidgetChannelManager={() => {
                return {
                    unsubscribeWidget: () => { return Promise.resolve(''); },
                    subscribeWidget: () => {
                        return Promise.resolve(null);
                    },
                };
            }}
        />
    </MuiThemeProvider>
);
