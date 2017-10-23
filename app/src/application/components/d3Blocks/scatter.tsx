import * as _ from 'lodash'
import * as d3 from 'd3'
import * as React from 'react'
import * as ReactDOM from 'react-dom'

import './scatter.less'

interface Props {
    version: any,
    data: any,
    dimensions: {
        width: number,
        height: number,
    },
    padding: {
        top: number,
        right: number,
        bottom: number,
        left: number,
    },
    colors: any,
}

interface State {

}

export class Scatter extends React.Component<Props, State> {
    // D3

    lineDimensions: {
        width: number
        height: number
    }
    padding: {
        top: number,
        right: number,
        bottom: number,
        left: number,
    }

    xScale: any
    yScale: any
    xAxis: any
    yAxis: any
    line: any

    datasets: any
    xmax: any
    xmin: any
    ymax: any
    ymin: any

    refs: any
    domContainer: any
    domAxes: any
    domLines: any
    domClouds: any
    domPoints: any

    updateAttributes() {
        let {width, height} = this.props.dimensions
        let {top, right, bottom, left} = this.props.padding

        this.lineDimensions = {
            width: width - right - left,
            height: height - top - bottom,
        }

        this.padding = this.props.padding

        this.datasets = this.props.data.datasets.map((a: any) => a.data)
        this.xmax = _.max(_.map(this.datasets, (dataset: any) => _.maxBy(dataset, (entry: any) => entry.x).x))
        this.xmin = _.max(_.map(this.datasets, (dataset: any) => _.minBy(dataset, (entry: any) => entry.x).x))
        this.ymax = _.max(_.map(this.datasets, (dataset: any) => _.maxBy(dataset, (entry: any) => entry.y).y))
        this.ymin = _.max(_.map(this.datasets, (dataset: any) => _.minBy(dataset, (entry: any) => entry.y).y))
    }

    renderAxes() {
        this.xScale = d3.scaleLinear()
            .domain([this.xmin, this.xmax])
            .range([0, this.lineDimensions.width])

        this.yScale = d3.scaleLinear()
            .domain([0, this.ymax])
            .range([this.lineDimensions.height, 0])

        this.domAxes = this.domContainer
            .attr('width', this.lineDimensions.width + this.padding.left + this.padding.right)
            .attr('height', this.lineDimensions.height + this.padding.top + this.padding.bottom)
            .select('.axes')
            .attr('transform', 'translate(' + this.padding.left + ',' + this.padding.top + ')')

        this.domAxes.select('.x-axis')
            .attr('transform', 'translate(0,' + this.lineDimensions.height + ')')
            .call(
                d3.axisBottom(this.xScale)
                    .ticks(5, d3.format('d'))
            )

        this.domAxes.select('.y-axis')
            .call(d3.axisLeft(this.yScale))
    }

    renderLines() {
        this.line = d3.line()
            .x((d: any) => this.xScale(d.x))
            .y((d: any) => this.yScale(d.y))

        this.domLines = this.domContainer.select('.lines')
            .selectAll('.line')
            .data(this.datasets, (dataset: any) => dataset)

        this.domLines.exit().remove()

        this.domLines
            .enter()
                .append('path')
                .attr('class', 'line')
                .attr('transform', 'translate(' + this.padding.left + ',' + this.padding.top + ')')
            .merge(this.domLines)
                .attr('d', this.line)
                .style('stroke', (d: any, i: number) => this.props.colors[i % this.props.colors.length])
    }

    renderPointsSide() {
        this.domClouds = this.domContainer.select('.clouds')
            .attr('transform', 'translate(' + this.padding.left + ',' + this.padding.top + ')')
            .selectAll('.cloud')
            .data(this.datasets)

        this.domClouds.exit().remove()

        this.domClouds
            .enter()
                .append('g')
                .attr('class', 'cloud')

        // This loop is necessary so as to have the index of the current
        // dataset we are displaying and thus be able to change the color
        // of the drawn dots accordingly.
        this.domClouds.each((datum: any, index: number) => {
            var domPoints = this.domClouds
                .selectAll('.line-' + index)
                .data(datum)

            domPoints.exit().remove()

            domPoints.enter()
                    .append('circle')
                    .attr('class', 'scatter-dot line-' + index)
                    .attr('r', 2)
                .merge(domPoints)
                    .attr('cx', (d: any) => this.xScale(d.x))
                    .attr('cy', (d: any) => this.yScale(d.y))
                    .attr('fill', this.props.colors[index % this.props.colors.length])
            }
        )
    }

    renderD3DomElements() {
        this.renderAxes()
        this.renderLines()
        this.renderPointsSide()
    }

    // REACT LIFECYCLE

    constructor(props: Props) {
        super(props)
    }

    componentDidMount() {
        this.domContainer = d3.select(this.refs.container)
        this.updateAttributes()
        this.renderD3DomElements()
    }

    shouldComponentUpdate(nextProps: Props, nextState: State) {
        if (nextProps.version === this.props.version) {
            return false
        }
        return true
    }

    componentDidUpdate() {
        this.updateAttributes()
        this.renderD3DomElements()
    }

    render() {
        let {width, height} = this.props.dimensions

        return (
            <svg
                ref='container'
                width={width}
                height={height}
            >
                <g className={'axes'}>
                    <g className={'x-axis'}></g>
                    <g className={'y-axis'}></g>
                </g>
                <g className={'lines'}></g>
                <g className={'clouds'}></g>
            </svg>
        )
    }
}
