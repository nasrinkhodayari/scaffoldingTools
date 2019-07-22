import React from "react";
import ReactDOM from "react-dom";
import { create } from "jss";
import rtl from "jss-rtl";
import { StylesProvider, jssPreset, createGenerateClassName } from "@material-ui/styles";
import { makeStyles } from "@material-ui/core/styles";
import { ThemeProvider } from "@material-ui/styles";
import { createMuiTheme } from "@material-ui/core/styles";
import CssBaseline from "@material-ui/core/CssBaseline";
import Paper from "@material-ui/core/Paper";
import Container from "@material-ui/core/Container";
import App from "./app";

const generateClassName: any = createGenerateClassName({ disableGlobal: true });
const jss: any = create({ plugins: [...jssPreset().plugins, rtl()] });
const theme: any = createMuiTheme({ direction: "rtl" });

const useStyles: any = makeStyles(theme => ({
    container: {
        padding: theme.spacing(4)
    },
    appBarSpacer: theme.mixins.toolbar,
}));


function Root(): any {
    const classes: any = useStyles();

    return (
        <Container maxWidth="md" className={classes.container}>
            <div className={classes.appBarSpacer} />
            <Paper className={classes.container}>
                <App />
            </Paper>
        </Container>
    );
}

(window as any).todoWidget = (widgetInstance: any) => {
    ReactDOM.render(
        <React.Fragment>
            <CssBaseline />
            <ThemeProvider theme={theme}>
                <StylesProvider generateClassName={generateClassName} jss={jss}>
                    <Root />
                </StylesProvider>
            </ThemeProvider>
        </React.Fragment>,
        widgetInstance.body
    );
};