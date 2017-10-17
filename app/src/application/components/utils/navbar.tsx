import * as React from 'react';
import { Breadcrumb } from '@blueprintjs/core';

interface Props {
    left_text?: any,
    right_text?: any,
}

export class NavBar extends React.Component<Props, any> {
    render() {
        const {left_text, right_text}  = this.props;

        return (
            <nav className={'pt-navbar pt-dark'}>
            <div className={'pt-navbar-group pt-align-left'}>
                <div className={'pt-navbar-heading'}>Orion</div>
                <span className={'pt-navbar-divider'}></span>
                {left_text}
            </div>
                <div className={'pt-navbar-group pt-align-right'}>
                    {right_text}
                </div>
            </nav>
        )
    }
}
