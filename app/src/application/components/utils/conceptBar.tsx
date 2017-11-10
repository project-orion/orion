import * as React from 'react'
import {Breadcrumb} from '@blueprintjs/core'

import {concept} from '../../types'

interface Props {
    concepts: concept[],
}

export class ConceptBar extends React.Component<Props, any> {
    render() {
        const {concepts} = this.props;

        const breadcrumbs = concepts.map((concept: concept) => {
                return (
                    <li key={concept.attributes.id + concept.loadedTime}>
                        <Breadcrumb
                            text={concept.attributes.name}
                        />
                    </li>
                )
            })

        return (
            <div className={'concept-bar'}>
                <ul className={'pt-breadcrumbs'}>
                    {breadcrumbs}
                </ul>
            </div>
        )
    }
}
