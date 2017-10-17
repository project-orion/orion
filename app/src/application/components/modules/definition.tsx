import * as React from 'react'

interface Props {
    text: string,
    source: string,
    link: string,
}

export class Definition extends React.Component<Props, any> {
    render () {
        var {text, source, link} = this.props

        return (
            <div
                className={'block-3'}
                style={{flexGrow: 1}}
            >
                <span><h4>Définition</h4> - <h6>Source : <a href={link}>{source}</a></h6></span>
                <div>
                    {text}
                </div>
            </div>
        )
    }
}
