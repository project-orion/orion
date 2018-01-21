import * as _ from 'lodash'
import * as React from 'react'
import Measure from 'react-measure'

import {Sunburst} from '../d3Blocks/sunburst'

import {
    module,
} from '../../types'
import * as actions from '../../actions'

interface Props {
    options?: any,
    sources?: any,
    data?: any,
    dispatch: any,
}

interface State {
    currentSearch: string,
    selectedSummaryIndex: number,
}

const colorScheme = ['#2965CC', '#29A634', '#D99E0B', '#D13913', '#8F398F', '#00B3A4', '#DB2C6F', '#9BBF30', '#96622D', '#7157D9']

export class JOSearch extends React.Component<Props, State> {
    constructor(props: Props) {
        super(props)
        this.state = {
            currentSearch: null,
            selectedSummaryIndex: null,
        }
    }

    handleArticleClick(href: string) {
        let parsedHref = /cidTexte\=(.[A-Z0-9]*)\&/g.exec(href)[1]
        console.log(parsedHref)
        this.props.dispatch(actions.testFetch(
            {
                'article': {
                    'arg':'article/_search/?size=10',
                    'json': true,
                    'body': {
                        'query': {
                            'match': {
                                'url': parsedHref,
                            }
                        }
                    }
                }
            }, 'jo', 'http://localhost:9200/'))
    }

    handleSummaryClick(index: number) {
        this.setState({
            selectedSummaryIndex: index,
        })
    }

    updateSearch(event: any) {
        this.setState({
            currentSearch: event.target.value,
        })
    }

    triggerSearch() {
        this.props.dispatch(actions.testFetch(
            {
                'foundArticles': {
                    'arg':'article/_search/?size=10',
                    'json': true,
                    'body': {
                        'query': {
                            'match': {
                                'article': this.state.currentSearch,
                            }
                        }
                    }
                }
            }, 'jo', 'http://localhost:9200/'))
    }

    buildHierarchy(articles: any) {
        let root: any = {
            'name': 'root',
            'children': []
        }

        for (let i = 0; i < articles.length; i++) {
            let href = articles[i].href
            let text = articles[i].text
            let parts = articles[i].path
            let currentNode = root

            for (let j = 0; j < parts.length; j++) {
                let children = currentNode['children']
                let nodeName = parts[j]
                let childNode

                if (j + 1 < parts.length) {
                    let foundChild = false
                    for (let k = 0; k < children.length; k++) {
                        if (children[k]['name'] == nodeName) {
                            childNode = children[k]
                            foundChild = true
                            break
                        }
                    }
                    if (!foundChild) {
                        childNode = {'name': nodeName, 'children': []}
                        children.push(childNode)
                    }
                    currentNode = childNode
                } else {
                    childNode = {'name': nodeName, 'href': href, 'text': text}
                    children.push(childNode)
                }
            }
        }

        return root
    }

    buildRecursiveLi(depth: number, node: any) {
        let title

        if (depth == 0) {
            title = <h2>{node.name}</h2>
        } else if (depth == 1) {
            title = <h3>{node.name}</h3>
        } else if (depth == 2) {
            title = <h4>{node.name}</h4>
        } else if (depth == 3) {
            title = <h5>{node.name}</h5>
        } else if (depth == 1){
            title = <h6>{node.name}</h6>
        } else {
            title = <h6>{node.name}</h6>
        }

        if (node.children) {
            return <li key={node.name}>
                    {title}
                    <ul>
                        {node.children.map(this.buildRecursiveLi.bind(this, depth+1))}
                    </ul>
                </li>
        } else {
            return <li
                className={'result'}
                onClick={() => this.handleArticleClick(node.href)}
                key={node.href}>{node.text}</li>
        }
    }

    render () {
        const title = 'Journal Officiel'
        const data = this.props.data ? this.props.data : {}
        const {selectedSummaryIndex} = this.state

        let summaries = (data && data.summaries) ? data.summaries.hits.hits : []

        let summariesLi = summaries.map((s: any, index: number) => {
            let date = s._source.url.split('/')
            let l = date.length
            let strDate = [date[l-3], date[l-2], date[l-1]].join('-')
            return <li
                onClick={() => this.handleSummaryClick(index)}
                key={index}>{strDate}</li>
        })

        const selectedSummary = (selectedSummaryIndex != null) ? summaries[selectedSummaryIndex] : null
        const hierarchy = (selectedSummaryIndex != null) ? this.buildHierarchy(summaries[selectedSummaryIndex]._source.array) : {}

        let summaryRecursiveLi = (hierarchy.children) ? hierarchy.children.map(this.buildRecursiveLi.bind(this, 0)) : null

        let article = (data && data.article) ? data.article.hits.hits[0]._source : null
        let entete = article ? article.entete : null
        let articleText = article ? article.article : null

        let foundArticles = (this.props.data && this.props.data.foundArticles) ? this.props.data.foundArticles.hits.hits : []
        let foundArticlesLi = foundArticles.map((a: any) => {
            return <li
                // onClick={() => this.handleArticleClick(a.href)}
                key={a._id}>{a._source.entete}</li>
        })

        return (
            <div
                className={'block'}
                style={{flexGrow: 2}}
            >
                <span>
                    <h4>{title}</h4>
                </span>

                <div className='pt-input-group'>
                    <span className='pt-icon pt-icon-search'></span>
                    <input type='text' className='pt-input' placeholder='Recherche...'
                        onChange={this.updateSearch.bind(this)}
                    />
                    <button className='pt-button pt-minimal pt-intent-primary pt-icon-arrow-right'
                        onClick={this.triggerSearch.bind(this)}
                    ></button>
                </div>

                <div id='foundArticles' className={'search-results'}>
                    <ul>
                        {foundArticlesLi}
                    </ul>
                </div>

                <div className={'flex-box flex-box-half'} id={'jo'}>
                    <div id='summaries' className={'search-results'}>
                        <ul>
                            {summariesLi}
                        </ul>
                    </div>
                    <div id='summaryArticles' className={'search-results-nested'}>
                        <ul>
                            {summaryRecursiveLi}
                        </ul>
                    </div>
                    <div id='article'>
                        <div id='entete'>
                            {entete}
                        </div>
                        <br/>
                        <div id='corps'>
                            {articleText}
                        </div>
                    </div>
                </div>
            </div>
        )
    }
}
