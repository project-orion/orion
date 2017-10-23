import * as _ from 'lodash'
import * as d3 from 'd3'
import * as React from 'react'
import * as ReactDOM from 'react-dom'

import './histogram.less'

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

export class Histogram extends React.Component<Props, State> {
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
    stack: any

    datasets: any
    inter: any
    xmax: any
    xmin: any
    ymax: any
    ymin: any

    refs: any
    domContainer: any
    domAxes: any
    domStacks: any
    domPoints: any
    barPadding: any

    updateAttributes() {
        let {width, height} = this.props.dimensions
        let {top, right, bottom, left} = this.props.padding

        this.lineDimensions = {
            width: width - right - left,
            height: height - top - bottom,
        }

        this.padding = this.props.padding

        this.inter = this.props.data.datasets.map((a: any) => a.data)

        this.datasets = this.inter[0]

        //this.datasets = this.props.data.datasets.map((a: any) => a.data)
        this.xmin = 1996
        this.xmax = 2017
        this.ymin = 0
        this.ymax = 4000
    }

    renderAxes() {
        this.xScale = d3.scaleLinear()
            .domain([this.xmin, this.xmax])
            .range([0, this.lineDimensions.width])

        this.yScale = d3.scaleLinear()
            .domain([this.ymin, this.ymax])
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
            .call(
                d3.axisLeft(this.yScale)
                    .ticks(5)
            )
    }

    renderPoints() {

        this.domPoints = this.domContainer.select('.rects')
            .attr('transform', 'translate(' + this.padding.left + ',' + this.padding.top + ')')
            .selectAll('.rect')
            .data(this.datasets)

        this.domPoints.exit().remove()

        this.domPoints.enter()
                .append('rect')
                .attr('class', 'rect')
                .attr('r', 2)
                .attr('width', 20)
            .merge(this.domPoints)
                .attr('x', (d: any) => this.xScale(d.x))
                .attr('y', (d: any) => this.yScale(d.y))
                .attr('height', (d:any) => this.yScale(this.ymax-d.y))
                .attr('fill', 'blue')

        console.log(this.domPoints)
    }



    renderD3DomElements() {
        this.renderAxes()
        this.renderPoints()
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
                <g className={'rects'}></g>
            </svg>
        )
    }
}
