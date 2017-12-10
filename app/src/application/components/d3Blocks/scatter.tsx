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
        toolbox_width: number,
        toolbox_height: number,
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
    rescaledXScale: any
    yScale: any
    xAxis: any
    yAxis: any

    zoom: any
    line: any
    dotRadius: number
    dotRadiusHover: number


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

    locale = d3.timeFormatLocale({
        'dateTime': '%A, %e %B %Y г. %X',
        'date': '%d.%m.%Y',
        'time': '%H:%M:%S',
        'periods': ['AM', 'PM'],
        'days': ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'],
        'shortDays': ['Lu', 'Ma', 'Me', 'Je', 'Ve', 'Sa', 'Di'],
        'months': ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'],
        'shortMonths': ['Jan', 'Fev', 'Mar', 'Avr', 'Mai', 'Jun', 'Jui', 'Aou', 'Sep', 'Oct', 'Nov', 'Dec']
    })

    formatMillisecond = this.locale.format('.%L')
    formatSecond = this.locale.format(':%S')
    formatMinute = this.locale.format('%I:%M')
    formatHour = this.locale.format('%I %p')
    formatDay = this.locale.format('%a %d')
    formatWeek = this.locale.format('%b %d')
    formatMonth = this.locale.format('%b-%y')
    formatYear = this.locale.format('%Y')

    updateAttributes() {
        let {width, height} = this.props.dimensions
        let {top, right, bottom, left} = this.props.padding


        this.dotRadius = 3
        this.dotRadiusHover = 6

        this.lineDimensions = {
            width: width - right - left,
            height: height - top - bottom,
        }

        this.padding = this.props.padding

        this.datasets = this.props.data.datasets.map((a: any) => a.data)
        this.xmax = _.max(_.map(this.datasets, (dataset: any) => _.maxBy(dataset, (entry: any) => entry.x).x))
        this.xmin = _.max(_.map(this.datasets, (dataset: any) => _.minBy(dataset, (entry: any) => entry.x).x))

        this.ymax = 1.1 * _.max(_.map(this.datasets, (dataset: any) => _.maxBy(dataset, (entry: any) => entry.y).y))
        this.ymin = 0.9 * _.max(_.map(this.datasets, (dataset: any) => _.minBy(dataset, (entry: any) => entry.y).y))

        if (this.lineDimensions.width >= 0 && this.lineDimensions.height >= 0) {
            this.domContainer.select('#clip-rect')
                .attr('width', this.lineDimensions.width)
                .attr('height', this.lineDimensions.height)
        }
    }

    zoomed() {
        const t = d3.event.transform
        if (!(isNaN(t.k) && isNaN(t.x) && isNaN(t.y))) {
            this.rescaledXScale = t.rescaleX(this.xScale)
            this.line.x((d: any) => this.rescaledXScale(d.x))

            this.domLines.attr('d', this.line)
            this.domContainer.selectAll('.scatter-dot').attr('cx', (d: any) => this.rescaledXScale(d.x))
            this.domContainer.select('.x-axis').call(this.xAxis.scale(this.rescaledXScale))
        }
    }

    handleMouseOver(that: any, d: any, i: any) {
        d3.select(this as any)
            .attr('r', that.dotRadiusHover)

        that.domContainer.select('.tooltip')
            .attr('opacity', 1)
            .attr('transform', 'translate(' +
                Math.min(that.rescaledXScale(d.x), that.lineDimensions.width - that.props.dimensions.toolbox_width) + ',' +
                Math.min(that.yScale(d.y), that.lineDimensions.height - that.props.dimensions.toolbox_height) + ')'
            )

        that.domContainer.select('.tooltip-value')
            .html('Valeur : ' + d.y)
            .attr('transform', 'translate(5,13)')
        that.domContainer.select('.tooltip-timestamp')
            .html('Date : ' + [d.x.getDay(), d.x.getMonth() + 1, d.x.getFullYear()].join('-'))
            .attr('transform', 'translate(5,26)')
    }

    handleMouseOut(that: any, d: any, i: any) {
        d3.select(this as any)
            .attr('r', that.dotRadius)

        that.domContainer.select('.tooltip')
            .attr('opacity', 0)
    }

    multiFormat(date: Date) {
        return (
            d3.timeSecond(date) < date ? this.formatMillisecond
            : d3.timeMinute(date) < date ? this.formatSecond
            : d3.timeHour(date) < date ? this.formatMinute
            : d3.timeDay(date) < date ? this.formatHour
            : d3.timeMonth(date) < date ? (d3.timeWeek(date) < date ? this.formatDay : this.formatWeek)
            : d3.timeYear(date) < date ? this.formatMonth
            : this.formatYear
        )(date)
    }

    renderAxes() {
        this.xScale = d3.scaleTime()
            .domain([this.xmin, this.xmax])
            .range([0, this.lineDimensions.width])

        this.rescaledXScale = this.xScale

        this.yScale = d3.scaleLinear()
            .domain([0, this.ymax])
            .range([this.lineDimensions.height, 0])


        this.xAxis = d3.axisBottom(this.xScale)
            .ticks(5)
            .tickFormat(this.multiFormat.bind(this))

        this.yAxis = d3.axisLeft(this.yScale)

        this.zoom = d3.zoom()
            .scaleExtent([1, 32])
            .translateExtent([[0, 0], [this.lineDimensions.width, this.lineDimensions.height]])
            .extent([[0, 0], [this.lineDimensions.width, this.lineDimensions.height]])
            .on('zoom', this.zoomed.bind(this))

        this.domAxes = this.domContainer
            .attr('width', this.lineDimensions.width + this.padding.left + this.padding.right)
            .attr('height', this.lineDimensions.height + this.padding.top + this.padding.bottom)
            .select('.axes')
                .attr('transform', 'translate(' + this.padding.left + ',' + this.padding.top + ')')

        this.domAxes.select('.x-axis')
            .attr('transform', 'translate(0,' + this.lineDimensions.height + ')')
            .call(this.xAxis)

        this.domAxes.select('.y-axis')
            .attr('transform', 'translate(' + this.lineDimensions.width / 2 + ', 0)')
            .call(this.yAxis)

    }

    renderLines() {
        this.line = d3.line()
            .x((d: any) => this.xScale(d.x))
            .y((d: any) => this.yScale(d.y))

        this.domLines = this.domContainer.select('.lines')
            .attr('width', this.lineDimensions.width)
            .attr('height', this.lineDimensions.height)
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

    renderPoints() {
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
                    .attr('r', this.dotRadius)
                .merge(domPoints)
                    .attr('cx', (d: any) => this.xScale(d.x))
                    .attr('cy', (d: any) => this.yScale(d.y))
                    .attr('fill', this.props.colors[index % this.props.colors.length])
                    // _.partial allows binding arguments without changing 'this'
                    .on('mouseover', _.partial(this.handleMouseOver, this))
                    .on('mouseout', _.partial(this.handleMouseOut, this))
            }
        )

        this.domContainer.call(this.zoom)
    }

    renderD3DomElements() {
        this.renderAxes()
        this.renderLines()
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
                className={'scatter'}
            >
                <g className={'axes'}>
                    <g className={'x-axis'}></g>
                    <g className={'y-axis'}></g>
                </g>
                <g className={'lines'}>
                    <clipPath id={'lines-clip-path'}>
                        <rect id={'clip-rect'}></rect>
                    </clipPath>
                </g>
                <g className={'clouds'}></g>
                <g className={'tooltip'} opacity={0}>
                    <rect
                        className={'tooltip-box'}
                        width={this.props.dimensions.toolbox_width}
                        height={this.props.dimensions.toolbox_height}
                    />
                    <text className={'tooltip-text tooltip-value'}></text>
                    <text className={'tooltip-text tooltip-timestamp'}></text>
                </g>
            </svg>
        )
    }
}
