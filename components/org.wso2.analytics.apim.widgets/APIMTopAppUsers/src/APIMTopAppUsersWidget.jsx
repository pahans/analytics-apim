/*
 *  Copyright (c) 2019, WSO2 Inc. (http://www.wso2.org) All Rights Reserved.
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

import React, { Component } from 'react';
import {
    defineMessages, IntlProvider, FormattedMessage, addLocaleData,
} from 'react-intl';
import Axios from 'axios';
import cloneDeep from 'lodash/cloneDeep';
import { MuiThemeProvider, createMuiTheme } from '@material-ui/core/styles';
import Paper from '@material-ui/core/Paper';
import Typography from '@material-ui/core/Typography';
import withWrappedWidget from '@analytics-apim/common-lib/src/WrappedWidget';

import APIMTopAppUsers from './APIMTopAppUsers';

const darkTheme = createMuiTheme({
    palette: {
        type: 'dark',
    },
    typography: {
        useNextVariants: true,
    },
});

const lightTheme = createMuiTheme({
    palette: {
        type: 'light',
    },
    typography: {
        useNextVariants: true,
    },
});

/**
 * Query string parameter
 * @type {string}
 */
const queryParamKey = 'topAppUsers';
/**
 * Compare two values and return the result
 * @param {object} a - data field
 * @param {object} b - data field
 * @return {number}
 * */
function sortFunction(a, b) {
    const nameA = a.appName.toLowerCase();
    const nameB = b.appName.toLowerCase();

    if (nameA < nameB) {
        return -1;
    }
    if (nameA > nameB) {
        return 1;
    }
    return 0;
}

/**
 * Widget for Top Application Users stats
 * @class APIMTopAppUsersWidget
 * @extends {Widget}
 */
class APIMTopAppUsersWidget extends Component {
    constructor(props) {
        super(props);
        this.styles = {
            paper: {
                padding: '5%',
                border: '2px solid #4555BB',
            },
            paperWrapper: {
                margin: 'auto',
                width: '50%',
                marginTop: '20%',
            },
            proxyPaperWrapper: {
                height: '75%',
            },
            proxyPaper: {
                background: '#969696',
                width: '75%',
                padding: '4%',
                border: '1.5px solid #fff',
                margin: 'auto',
                marginTop: '5%',
            },
        };

        this.state = {
            limit: 5,
            applicationUUIDMap: [],
            applicationList: [],
            applicationSelected: null,
            usageData: [],
            legendData: [],
            inProgress: true,
            proxyError: false,
        };

        this.handlePublisherParameters = this.handlePublisherParameters.bind(this);
        this.applicationSelectedHandleChange = this.applicationSelectedHandleChange.bind(this);
        this.handleLimitChange = this.handleLimitChange.bind(this);
        this.assembleAppQuery = this.assembleAppQuery.bind(this);
        this.handleAppDataReceived = this.handleAppDataReceived.bind(this);
        this.assembleMainQuery = this.assembleMainQuery.bind(this);
        this.handleDataReceived = this.handleDataReceived.bind(this);
        this.getApplicationIds = this.getApplicationIds.bind(this);
        this.handleAppIdDataReceived = this.handleAppIdDataReceived.bind(this);
    }

    componentWillUnmount() {
        const { id, getWidgetChannelManager } = this.props;
        getWidgetChannelManager().unsubscribeWidget(id);
    }

    /**
     * Retrieve params from publisher - DateTimeRange
     *
     * @param receivedMsg  message received from subscribed widgets
     * @memberof APIMTopAppUsersWidget
     * */
    handlePublisherParameters(receivedMsg) {
        const { id, getGlobalState } = this.props;
        const queryParam = getGlobalState('dtrp');
        const { sync } = queryParam;

        this.setState({
            timeFrom: receivedMsg.from,
            timeTo: receivedMsg.to,
            perValue: receivedMsg.granularity,
            inProgress: !sync,
        }, this.assembleAppQuery);
    }

    /**
     * Retrieve applications of subscriber
     * @memberof APIMTopAppUsersWidget
     * */
    assembleAppQuery() {
        Axios.get(`${window.contextPath}/apis/analytics/v1.0/apim/applications`)
            .then((response) => {
                this.setState({ proxyError: false });
                this.handleAppDataReceived(response.data);
            })
            .catch((error) => {
                this.setState({ proxyError: true, inProgress: false });
                console.error(error);
            });
    }

    /**
     * Formats data retrieved from assembleAppQuery
     * @param {object} data - data retrieved
     * @memberof APIMTopAppUsersWidget
     * */
    handleAppDataReceived(data) {
        const { list } = data;

        if (list && list.length > 0) {
            const applicationUUIDMap = {};
            list.forEach((dataUnit) => {
                applicationUUIDMap[dataUnit.applicationId] = {
                    appName: dataUnit.name + ' (' + dataUnit.owner + ')',
                    appOwner: dataUnit.owner,
                };
            });
            this.setState({ applicationUUIDMap }, this.getApplicationIds);
        } else {
            this.setState({ inProgress: false, usageData: [] });
        }
    }

    /**
     * Retrieve API Id from API UUID
     */
    getApplicationIds() {
        const { applicationUUIDMap, providerConfig } = this.state;

        if (providerConfig) {
            const { id, widgetID: widgetName } = this.props;
            const dataProviderConfigs = cloneDeep(providerConfig);

            dataProviderConfigs.configs.config.queryData.queryName = 'applicationQuery';
            dataProviderConfigs.configs.config.queryData.queryValues = {
                '{{applicationUUID}}': 'UUID==\'' + Object.keys(applicationUUIDMap).join('\' OR UUID==\'') + '\'',
            };
            getWidgetChannelManager()
                .subscribeWidget(id, widgetName, this.handleAppIdDataReceived, dataProviderConfigs);
        } else {
            this.setState({ inProgress: false, usageData: [] });
        }
    }

    /**
     * Formats data retrieved from assembleAppQuery
     * @param {object} message - data retrieved
     * @memberof APIMTopAppUsersWidget
     * */
    handleAppIdDataReceived(message) {
        const { data } = message;
        const { id, getWidgetChannelManager } = this.props;
        const { applicationUUIDMap } = this.state;

        if (data) {
            const queryParam = super.getGlobalState(queryParamKey);
            let { applicationSelected, limit } = queryParam;
            if (!limit || limit < 0) {
                limit = 5;
            }
            const applicationList = data.map((dataUnit) => {
                const app = applicationUUIDMap[dataUnit[1]];
                [app.appId] = dataUnit;
                return app;
            });
            applicationList.sort(sortFunction);
            applicationList.unshift({
                appId: 'All',
                appName: 'All',
            });

            if (!applicationSelected
                || !applicationList.some(application => application.appId === applicationSelected)) {
                applicationSelected = 'All';
            }
            this.setQueryParam(applicationSelected, limit);
            getWidgetChannelManager().unsubscribeWidget(id);
            this.setState({ applicationList, applicationSelected, limit }, this.assembleMainQuery);
        } else {
            this.setState({ inProgress: false, usageData: [] });
        }
    }

    /**
     * Formats the siddhi query - appUsageQuery
     * @memberof APIMTopAppUsersWidget
     * */
    assembleMainQuery() {
        const {
            timeFrom, timeTo, perValue, providerConfig, applicationList,
        } = this.state;
        const queryParam = super.getGlobalState(queryParamKey);
        const { applicationSelected, limit } = queryParam;

        if (applicationSelected && limit) {
            const { id, widgetID: widgetName, subscribeWidget } = this.props;
            const dataProviderConfigs = cloneDeep(providerConfig);
            const applicationIds = applicationList.map((app) => { return app.appId; });
            let applicationCondition;

            if (applicationSelected === 'All') {
                applicationCondition = 'applicationId==\'' + applicationIds.join('\' OR applicationId==\'') + '\'';
                applicationCondition = applicationCondition.replace('applicationId==\'All\' OR ', '');
            } else {
                applicationCondition = 'applicationId==\'' + applicationSelected + '\'';
            }

            dataProviderConfigs.configs.config.queryData.queryName = 'appUsageQuery';
            dataProviderConfigs.configs.config.queryData.queryValues = {
                '{{application}}': applicationCondition,
                '{{from}}': timeFrom,
                '{{to}}': timeTo,
                '{{per}}': perValue,
                '{{limit}}': limit,
            };
            subscribeWidget('usageData', dataProviderConfigs);
        } else {
            this.setState({ inProgress: false, usageData: [] });
        }
    }

    // /**
    //  * Formats data retrieved from assembleMainQuery
    //  * @param {object} message - data retrieved
    //  * @memberof APIMTopAppUsersWidget
    //  * */
    // handleDataReceived(message) {
    //     const { data } = message;

    //     if (data) {
    //         const usageData = data.map((dataUnit) => {
    //             return {
    //                 username: dataUnit[0],
    //                 hits: dataUnit[1],
    //             };
    //         });
    //         const legendData = usageData.map((dataUnit) => {
    //             return { name: dataUnit.username };
    //         });
    //         this.setState({ usageData, legendData, inProgress: false });
    //     } else {
    //         this.setState({ inProgress: false, usageData: [] });
    //     }
    // }

    /**
     * Updates query param values
     * @param {string} applicationSelected - API Name menu option selected
     * @param {number} limit - data limitation value
     * @memberof APIMTopAppUsersWidget
     * */
    setQueryParam(applicationSelected, limit) {
        super.setGlobalState(queryParamKey, {
            applicationSelected,
            limit,
        });
    }

    /**
     * Handle onChange of limit
     * @param {Event} event - listened event
     * @memberof APIMTopAppUsersWidget
     * */
    handleLimitChange(event) {
        const { id, getWidgetChannelManager } = this.props;
        const { applicationSelected } = this.state;
        // disallow negative and decimal values
        const limit = (event.target.value).replace('-', '').split('.')[0];

        this.setQueryParam(applicationSelected, parseInt(limit, 10));
        if (limit) {
            this.setState({ inProgress: true, limit });
            getWidgetChannelManager().unsubscribeWidget(id);
            this.assembleMainQuery();
        } else {
            this.setState({ limit });
        }
    }

    /**
     * Handle onChange selected application
     * @param {Event} event - listened event
     * @memberof APIMTopAppUsersWidget
     * */
    applicationSelectedHandleChange(event) {
        this.setState({ inProgress: true });
        let { limit } = this.state;
        const { id, getWidgetChannelManager } = this.props;

        if (!limit) {
            limit = 5;
        }

        this.setQueryParam(event.target.value, limit);
        this.setState({ applicationSelected: event.target.value, limit });
        getWidgetChannelManager().unsubscribeWidget(id);
        this.assembleMainQuery();
    }

    /**
     * @inheritDoc
     * @returns {ReactElement} Render the APIM Top Application Users widget
     * @memberof APIMTopAppUsersWidget
     */
    render() {
        const {
            faultyProviderConfig, limit, applicationSelected,
            applicationList, inProgress, proxyError,
        } = this.state;
        const {
            paper, paperWrapper, proxyPaper, proxyPaperWrapper,
        } = this.styles;
        const { muiTheme, width, height, data } = this.props;
        const { usageData } = data;
        const themeName = muiTheme.name;
        const appUsersProps = {
            themeName,
            height,
            width,
            limit,
            applicationList,
            applicationSelected,
            usageData,
            [],
            inProgress,
        };

        return (
            <MuiThemeProvider
                theme={themeName === 'dark' ? darkTheme : lightTheme}
            >
                { proxyError ? (
                    <div style={proxyPaperWrapper}>
                        <Paper
                            elevation={1}
                            style={proxyPaper}
                        >
                            <Typography variant='h5' component='h3'>
                                <FormattedMessage
                                    id='apim.server.error.heading'
                                    defaultMessage='Error!'
                                />
                            </Typography>
                            <Typography component='p'>
                                <FormattedMessage
                                    id='apim.server.error'
                                    defaultMessage='Error occurred while retrieving application list.'
                                />
                            </Typography>
                        </Paper>
                    </div>
                ) : (
                    <div>
                        {
                            faultyProviderConfig ? (
                                <div style={paperWrapper}>
                                    <Paper
                                        elevation={1}
                                        style={paper}
                                    >
                                        <Typography variant='h5' component='h3'>
                                            <FormattedMessage
                                                id='config.error.heading'
                                                defaultMessage='Configuration Error !'
                                            />
                                        </Typography>
                                        <Typography component='p'>
                                            <FormattedMessage
                                                id='config.error.body'
                                                defaultMessage={'Cannot fetch provider configuration for APIM'
                                                + ' Top Application Users widget'}
                                            />
                                        </Typography>
                                    </Paper>
                                </div>
                            ) : (
                                <APIMTopAppUsers
                                    {...appUsersProps}
                                    applicationSelectedHandleChange={this.applicationSelectedHandleChange}
                                    handleLimitChange={this.handleLimitChange}
                                />
                            )
                        }
                    </div>
                )}
            </MuiThemeProvider>
        );
    }
}

withWrappedWidget(APIMTopAppUsersWidget, 'APIMTopAppUsers');

export default APIMTopAppUsersWidget;
