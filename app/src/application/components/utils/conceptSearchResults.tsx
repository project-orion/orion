import * as _ from 'lodash'
import * as React from 'react'
import * as slug from 'slug'

import * as actions from './../../actions'

interface Props {
    graphNodes: any,
    searchedConcept: string,
    dispatch?: any,
}

export class ConceptSearchResults extends React.Component<Props, any> {
    handleClick(event: any) {
        let nodeId = event.target.dataset.id
        let clickedNode = _.find(this.props.graphNodes, (node: any) => node.data.id == nodeId)
        let clickedRootNode = clickedNode.ancestors().reverse()[0]
        console.log(clickedNode)
        console.log(clickedRootNode)

        this.props.dispatch(actions.changeSelectedRootNav(clickedRootNode))
        this.props.dispatch(actions.changeSelectedNodeNav(clickedNode))
    }

    render() {
        const {graphNodes} = this.props;

        const selectedNodes: any = []
        if (this.props.searchedConcept && this.props.searchedConcept.length > 0) {
            graphNodes.forEach((node: any) => {
                if (node.data.slug.indexOf(slug(this.props.searchedConcept, {lower: true})) != -1) {
                    selectedNodes.push(node)
                }
            })
        }

        let selectedNodesLi = _.map(selectedNodes, (node: any) => {
            return <li
                key={node.data.id}
                data-id={node.data.id}
                onClick={this.handleClick.bind(this)}
            >
                <ul className='pt-breadcrumbs'>
                    {_.map(node.ancestors().reverse(), (ancestor: any) =>
                        <li className='pt-breadcrumb' key={ancestor.data.id}>
                            {ancestor.data.name}
                        </li>
                    )}
                </ul>
            </li>
        })

        return (
            <div className={'search-results'}>
                <ul>
                    {selectedNodesLi}
                </ul>
            </div>
        )
    }
}
