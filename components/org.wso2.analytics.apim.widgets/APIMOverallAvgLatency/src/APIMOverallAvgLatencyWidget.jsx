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

import React from 'react';
import {
    addLocaleData, defineMessages, IntlProvider, FormattedMessage,
} from 'react-intl';
import Axios from 'axios';
import cloneDeep from 'lodash/cloneDeep';
import { MuiThemeProvider, createMuiTheme } from '@material-ui/core/styles';
import CircularProgress from '@material-ui/core/CircularProgress';
import Paper from '@material-ui/core/Paper';
import Typography from '@material-ui/core/Typography';
import Widget from '@wso2-dashboards/widget';
import APIMOverallAvgLatency from './APIMOverallAvgLatency';

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
 * Language
 * @type {string}
 */
const language = (navigator.languages && navigator.languages[0]) || navigator.language || navigator.userLanguage;

/**
 * Language without region code
 */
const languageWithoutRegionCode = language.toLowerCase().split(/[_-]+/)[0];

/**
 * Create React Component for Apim Overall Avg Latency widget
 * @class APIMOverallAvgLatencyWidget
 * @extends {Widget}
 */
class APIMOverallAvgLatencyWidget extends Widget {
    /**
     * Creates an instance of APIMOverallAvgLatencyWidget.
     * @param {any} props @inheritDoc
     * @memberof APIMOverallAvgLatencyWidget
     */
    constructor(props) {
        super(props);
        this.state = {
            width: this.props.width,
            height: this.props.height,
            totalCount: 0,
            latency: 0,
            avglatency: 0,
            messages: null,
            inProgress: true,
        };

        this.styles = {
            loadingIcon: {
                margin: 'auto',
                display: 'block',
            },
            paper: {
                padding: '5%',
                border: '2px solid #4555BB',
            },
            paperWrapper: {
                margin: 'auto',
                width: '50%',
                marginTop: '20%',
            },
            loading: {
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: this.props.height,
            },
        };

        // This will re-size the widget when the glContainer's width is changed.
        if (this.props.glContainer !== undefined) {
            this.props.glContainer.on('resize', () => this.setState({
                width: this.props.glContainer.width,
                height: this.props.glContainer.height,
            }));
        }

        this.handlePublisherParameters = this.handlePublisherParameters.bind(this);
        this.assembleTotalQuery = this.assembleTotalQuery.bind(this);
        this.handleTotalCountReceived = this.handleTotalCountReceived.bind(this);
        this.assembleLatencyQuery = this.assembleLatencyQuery.bind(this);
        this.handleTotalLatencyReceived = this.handleTotalLatencyReceived.bind(this);
        this.calculateAverageLatency = this.calculateAverageLatency.bind(this);
    }

    componentWillMount() {
        const locale = (languageWithoutRegionCode || language || 'en');
        this.loadLocale(locale).catch(() => {
            this.loadLocale().catch(() => {
                // TODO: Show error message.
            });
        });
    }

    componentDidMount() {
        const { widgetID } = this.props;

        super.getWidgetConfiguration(widgetID)
            .then((message) => {
                this.setState({
                    providerConfig: message.data.configs.providerConfig,
                }, () => super.subscribe(this.handlePublisherParameters));
            })
            .catch((error) => {
                console.error("Error occurred when loading widget '" + widgetID + "'. " + error);
                this.setState({
                    faultyProviderConfig: true,
                });
            });
    }

    componentWillUnmount() {
        const { id } = this.props;
        super.getWidgetChannelManager().unsubscribeWidget(id);
    }

    /**
      * Load locale file
      * @param {string} locale Locale name
      * @memberof APIMOverallAvgLatencyWidget
      * @returns {string}
      */
    loadLocale(locale = 'en') {
        return new Promise((resolve, reject) => {
            Axios
                .get(`${window.contextPath}/public/extensions/widgets/APIMOverallAvgLatency/locales/${locale}.json`)
                .then((response) => {
                    // eslint-disable-next-line global-require, import/no-dynamic-require
                    addLocaleData(require(`react-intl/locale-data/${locale}`));
                    this.setState({ messages: defineMessages(response.data) });
                    resolve();
                })
                .catch(error => reject(error));
        });
    }

    /**
     * Retrieve params from publisher - DateTimeRange
     * @param {object} receivedMsg timeFrom, TimeTo, perValue
     * @memberof APIMOverallAvgLatencyWidget
   */
    handlePublisherParameters(receivedMsg) {
        const queryParam = super.getGlobalState('dtrp');
        const { sync } = queryParam;

        this.setState({
            timeFrom: receivedMsg.from,
            timeTo: receivedMsg.to,
            perValue: receivedMsg.granularity,
            inProgress: !sync,
        }, this.assembleTotalQuery);
    }

    /**
     * Formats the siddhi query
     * @memberof APIMOverallAvgLatencyWidget
     * */
    assembleTotalQuery() {
        const {
            timeFrom, timeTo, perValue, providerConfig,
        } = this.state;
        const { id, widgetID: widgetName } = this.props;

        const dataProviderConfigs = cloneDeep(providerConfig);
        dataProviderConfigs.configs.config.queryData.queryName = 'totalreqcountquery';
        dataProviderConfigs.configs.config.queryData.queryValues = {
            '{{from}}': timeFrom,
            '{{to}}': timeTo,
            '{{per}}': perValue,
        };
        super.getWidgetChannelManager()
            .subscribeWidget(id, widgetName, this.handleTotalCountReceived, dataProviderConfigs);
    }

    /**
     * Formats data received from assembleTotalQuery
     * @param {object} message - data retrieved
     * @memberof APIMOverallAvgLatencyWidget
     * */
    handleTotalCountReceived(message) {
        const { data } = message;
        const { id } = this.props;

        if (data.length !== 0) {
            this.setState({ totalCount: data, inProgress: false });
        } else {
            this.setState({ totalCount: 0, inProgress: false });
        }
        super.getWidgetChannelManager().unsubscribeWidget(id);
        this.assembleLatencyQuery();
    }

    /**
     * Formats the siddhi query
     * @memberof APIMOverallAvgLatencyWidget
     * */
    assembleLatencyQuery() {
        const {
            timeFrom, timeTo, perValue, providerConfig,
        } = this.state;
        const { id, widgetID: widgetName } = this.props;

        const dataProviderConfigs = cloneDeep(providerConfig);
        dataProviderConfigs.configs.config.queryData.queryName = 'assemblelatencyQuery';
        dataProviderConfigs.configs.config.queryData.queryValues = {
            '{{from}}': timeFrom,
            '{{to}}': timeTo,
            '{{per}}': perValue,
        };
        super.getWidgetChannelManager()
            .subscribeWidget(id, widgetName, this.handleTotalLatencyReceived, dataProviderConfigs);
    }

    /**
     * Formats data received from assembleLatencyQuery
     * @param {object} message - data retrieved
     * @memberof APIMOverallAvgLatencyWidget
     * */
    handleTotalLatencyReceived(message) {
        const { data } = message;
        const { id } = this.props;

        if (data.length !== 0) {
            this.setState({ latency: data });
        } else {
            this.setState({ latency: 0 });
        }

        super.getWidgetChannelManager().unsubscribeWidget(id);
        this.calculateAverageLatency();
    }

    /**
     * calculate the average Latency
     * @memberof APIMOverallAvgLatencyWidget
     * */
    calculateAverageLatency() {
        const { totalCount, latency } = this.state;
        const avglatency = (latency / totalCount).toPrecision(3);

        if (isNaN(avglatency)) {
            this.setState({ avglatency: 0, inProgress: false });
        } else {
            this.setState({ avglatency, inProgress: false });
        }
    }

    /**
     * @inheritDoc
     * @returns {ReactElement} Render the APIM Overall Avg Latency Widget
     * @memberof APIMOverallAvgLatencyWidget
     */
    render() {
        const {
            messages, faultyProviderConf, inProgress, timeFrom, timeTo, avglatency,
        } = this.state;
        const {
            loadingIcon, paper, paperWrapper, loading,
        } = this.styles;
        const { muiTheme } = this.props;
        const themeName = muiTheme.name;
        const apiCreatedProps = {
            themeName, avglatency, timeFrom, timeTo,
        };

        if (inProgress) {
            return (
                <div style={loading}>
                    <CircularProgress style={loadingIcon} />
                </div>
            );
        }
        return (
            <IntlProvider
                locale={language}
                messages={messages}
            >
                <MuiThemeProvider theme={themeName === 'dark' ? darkTheme : lightTheme}>
                    {
                        faultyProviderConf ? (
                            <div style={paperWrapper}>
                                <Paper
                                    elevation={1}
                                    style={paper}
                                >
                                    <Typography
                                        variant='h5'
                                        component='h3'
                                    >
                                        <FormattedMessage
                                            id='config.error.heading'
                                            defaultMessage='Configuration Error !'
                                        />
                                    </Typography>
                                    <Typography component='p'>
                                        <FormattedMessage
                                            id='config.error.body'
                                            defaultMessage={'Cannot fetch provider configuration for APIM '
                                            + 'Overall Avg Latency Widget'}
                                        />
                                    </Typography>
                                </Paper>
                            </div>
                        ) : (
                            <APIMOverallAvgLatency
                                {...apiCreatedProps}
                            />
                        )
                    }
                </MuiThemeProvider>
            </IntlProvider>
        );
    }
}

global.dashboard.registerWidget('APIMOverallAvgLatency', APIMOverallAvgLatencyWidget);
