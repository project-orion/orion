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
}

const colorScheme = ['#2965CC', '#29A634', '#D99E0B', '#D13913', '#8F398F', '#00B3A4', '#DB2C6F', '#9BBF30', '#96622D', '#7157D9']

export class JOSearch extends React.Component<Props, State> {
    constructor(props: Props) {
        super(props)
        this.state = {
            currentSearch: null,
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

    render () {
        const title = 'Journal Officiel'
        const data = this.props.data ? this.props.data : {}

        let summaries = (data && data.summaries) ? data.summaries.hits.hits : []
        let selectedSummary = summaries.length > 0 ? summaries[0] : null

        let articles = (selectedSummary) ? selectedSummary._source.array : []
        let articlesLi = articles.map((a: any) => {
            return <li
                onClick={() => this.handleArticleClick(a.href)}
                key={a.i}>{a.text}</li>
        })

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
                <div className={'flex-box flex-box-half'}>
                    <div id='summaryArticles' className={'search-results'}>
                        <ul>
                            {articlesLi}
                        </ul>
                    </div>
                    <div id='article'>
                        {entete}
                        {articleText}
                    </div>
                </div>
            </div>
        )
    }
}
