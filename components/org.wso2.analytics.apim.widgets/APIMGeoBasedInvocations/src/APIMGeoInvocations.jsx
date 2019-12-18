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

import React from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage } from 'react-intl';
import CircularProgress from '@material-ui/core/CircularProgress';
import Paper from '@material-ui/core/Paper';
import Typography from '@material-ui/core/Typography';
import VizG from 'react-vizgrammar';
import { Scrollbars } from 'react-custom-scrollbars';
import FormControl from '@material-ui/core/FormControl';
import MenuItem from '@material-ui/core/MenuItem';
import Select from '@material-ui/core/Select';
import InputLabel from '@material-ui/core/InputLabel';
import Input from '@material-ui/core/Input';
import Tooltip from '@material-ui/core/Tooltip';

/**
 * React Component for APIM Geo Based Invocations widget data
 * @param {any} props @inheritDoc
 * @returns {ReactElement} Render the APIM Geo Based Invocations widget data
 */
export default function APIMGeoInvocations(props) {
    const {
        themeName, chartConfig, metadata, width, geoData, inProgress, height, apiCreatedBy, apiSelected,
        apiVersion, apilist, versionlist, apiCreatedHandleChange, apiSelectedHandleChange, apiVersionHandleChange
    } = props;
    const styles = {
        paperWrapper: {
            height: '75%',
        },
        paper: {
            background: themeName === 'dark' ? '#969696' : '#E8E8E8',
            borderColor: themeName === 'dark' ? '#fff' : '#D8D8D8',
            width: '75%',
            padding: '4%',
            border: '1.5px solid',
            marginLeft:'5%',
        },
        dataWrapper: {
            height: '80%',
        },
        loadingIcon: {
            margin: 'auto',
            display: 'block',
        },
        loading: {
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height,
        },
        headingWrapper: {
            margin: 'auto',
            width: '95%',
        },
        formWrapper: {
            marginBottom: '5%',
        },
        form: {
            display: 'flex',
            flexWrap: 'wrap',
        },
        formControl: {
            marginLeft: '5%',
            marginTop: '5%',
            minWidth: 120,
        },
        formLabel: {
            whiteSpace: 'nowrap',
            textOverflow: 'ellipsis',
            width: '100%',
            display: 'block',
            overflow: 'hidden',
        },
    };

    return (
        <Scrollbars
            style={{ height }}
        >
            <div
                style={{
                    backgroundColor: themeName === 'dark' ? '#0e1e33' : '#fff',
                    height,
                    margin: '10px',
                    padding: '20px',
                }}
            >
                <div style={styles.headingWrapper}>
                    <div style={{
                        borderBottom: themeName === 'dark' ? '1px solid #fff' : '1px solid #02212f',
                        paddingBottom: '10px',
                        margin: 'auto',
                        marginTop: 0,
                        textAlign: 'left',
                        fontWeight: 'normal',
                        letterSpacing: 1.5,
                    }}
                    >
                        <FormattedMessage id='widget.heading' defaultMessage='GEO LOCATION BASED INVOCATIONS' />
                    </div>
                </div>
                <div style={styles.formWrapper}>
                    <form style={styles.form}>
                        <FormControl style={styles.formControl}>
                            <Tooltip
                                placement='top'
                                title={<FormattedMessage id='createdBy.label' defaultMessage='API Created By' />}
                            >
                                <InputLabel
                                    shrink
                                    htmlFor='api-createdBy-label-placeholder'
                                    style={styles.formLabel}
                                >
                                    <FormattedMessage id='createdBy.label' defaultMessage='API Created By' />
                                </InputLabel>
                            </Tooltip>
                            <Select
                                value={apiCreatedBy}
                                onChange={apiCreatedHandleChange}
                                input={<Input name='apiCreatedBy' id='api-createdBy-label-placeholder' />}
                                displayEmpty
                                name='apiCreatedBy'
                            >
                                <MenuItem value='All'>
                                    <FormattedMessage id='all.menuItem' defaultMessage='All' />
                                </MenuItem>
                                <MenuItem value='Me'>
                                    <FormattedMessage id='me.menuItem' defaultMessage='Me' />
                                </MenuItem>
                            </Select>
                        </FormControl>
                        <FormControl style={styles.formControl}>
                            <Tooltip
                                placement='top'
                                title={<FormattedMessage id='apiName.label' defaultMessage='API Name' />}
                            >
                                <InputLabel
                                    shrink
                                    htmlFor='apiSelected-label-placeholder'
                                    style={styles.formLabel}
                                >
                                    <FormattedMessage id='apiName.label' defaultMessage='API Name' />
                                </InputLabel>
                            </Tooltip>
                            <Select
                                value={apiSelected}
                                onChange={apiSelectedHandleChange}
                                input={<Input name='apiSelected' id='apiSelected-label-placeholder' />}
                                displayEmpty
                                name='apiSelected'
                            >
                                {
                                    apilist.map(option => (
                                        <MenuItem key={option} value={option}>
                                            {option}
                                        </MenuItem>
                                    ))
                                }
                            </Select>
                        </FormControl>
                        <FormControl style={styles.formControl}>
                            <Tooltip
                                placement='top'
                                title={<FormattedMessage id='apiVersion.label' defaultMessage='API Version' />}
                            >
                                <InputLabel
                                    shrink
                                    htmlFor='apiVersion-label-placeholder'
                                    style={styles.formLabel}
                                >
                                    <FormattedMessage id='apiVersion.label' defaultMessage='API Version' />
                                </InputLabel>
                            </Tooltip>
                            <Select
                                value={apiVersion}
                                onChange={apiVersionHandleChange}
                                input={<Input name='apiVersion' id='apiVersion-label-placeholder' />}
                                displayEmpty
                                name='apiVersion'
                            >
                                {
                                    versionlist.map(option => (
                                        <MenuItem key={option} value={option}>
                                            {option}
                                        </MenuItem>
                                    ))
                                }
                            </Select>
                        </FormControl>
                    </form>
                </div>
                <div>
                    { inProgress ? (
                        <div style={styles.loading}>
                            <CircularProgress style={styles.loadingIcon} />
                        </div>
                    ) : (
                        <div>
                            { !geoData || geoData.length === 0 ? (
                                <div style={styles.paperWrapper}>
                                    <Paper
                                        elevation={1}
                                        style={styles.paper}
                                    >
                                        <Typography variant='h5' component='h3'>
                                            <FormattedMessage id='nodata.error.heading' defaultMessage='No Data Available !' />
                                        </Typography>
                                        <Typography component='p'>
                                            <FormattedMessage
                                                id='nodata.error.body'
                                                defaultMessage='No data available for the selected options.'
                                            />
                                        </Typography>
                                    </Paper>
                                </div>
                            ) : (
                                <div style={styles.dataWrapper}>
                                    <VizG
                                        config={chartConfig}
                                        metadata={metadata}
                                        data={geoData}
                                        width={width}
                                        theme={themeName}
                                    />
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </Scrollbars>
    );
}

APIMGeoInvocations.propTypes = {
    themeName: PropTypes.string.isRequired,
    chartConfig: PropTypes.instanceOf(Object).isRequired,
    metadata: PropTypes.instanceOf(Object).isRequired,
    width: PropTypes.string.isRequired,
    geoData: PropTypes.instanceOf(Object).isRequired,
};
