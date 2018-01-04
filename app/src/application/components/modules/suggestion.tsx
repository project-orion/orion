import * as React from 'react'

interface Props {
    concepts: string[],
    dispatch: any,
    actionToDispatch: any,
    sendFetchAction: (slug: string) => void,
}

export class Suggestion extends React.Component<Props, any> {
    render () {
        var {concepts} = this.props

        let liste = concepts.map((slug: string) => {
            return (
                <li key={slug}>
                    <a
                        onClick={() => this.props.sendFetchAction(slug)}
                    >
                        {slug.toUpperCase()}
                    </a>
                </li>
            )
        })

        return (
            <div
                className={'block'}
                style={{flexGrow: 1}}
            >
                <span><h4>Concepts Associés</h4></span>
                <ul>
                    {liste}
                </ul>
            </div>
        )
    }
}
