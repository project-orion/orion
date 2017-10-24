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
    stacking: boolean,
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

    datasets: any
    newdatasets: any
    totalDataset: any
    numberDatasets: any
    xmax: any
    xmin: any
    ymax: any
    ymin: any

    refs: any
    domContainer: any
    domAxes: any
    domClouds: any
    barPadding: any
    change: boolean

    inter:any
    inter2:any

    updateAttributes() {

        let {width, height} = this.props.dimensions
        let {top, right, bottom, left} = this.props.padding

        this.lineDimensions = {
            width: width - right - left,
            height: height - top - bottom,
        }

        this.padding = this.props.padding

        this.datasets = this.props.data.datasets.map((a: any) => a.data)
        this.numberDatasets = this.datasets.length


        this.totalDataset = []

        for (var i=0; i <this.datasets[0].length ; i++ ){
            var x = this.datasets[0][i].x
            var y = []
            for (var j=0; j < this.numberDatasets; j++){
                var row = _.find(this.datasets[j], function(q: any){ return q.x == x });
                y.push(row.y)
            }
            this.totalDataset.push({x:x,y:y})
        }

        this.newdatasets = []
        for (var j=0; j < this.numberDatasets; j++){
            this.newdatasets.push(this.totalDataset)
        }

        this.xmax = _.max(_.map(this.datasets, (dataset: any) => _.maxBy(dataset, (entry: any) => entry.x).x))
        this.xmin = _.min(_.map(this.datasets, (dataset: any) => _.minBy(dataset, (entry: any) => entry.x).x))
        this.ymax = _.max(_.map(this.datasets, (dataset: any) => _.maxBy(dataset, (entry: any) => entry.y).y))*2
        this.ymin = 0

        this.barPadding = _.max([Math.ceil(this.lineDimensions.width/this.datasets[0].length/2.2)-2, 1])
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

    renderBarSide() {
        this.barPadding = _.max([Math.ceil(this.lineDimensions.width/this.datasets[0].length/(.1 + this.numberDatasets))-2, 1])
        this.domClouds = this.domContainer.select('.clouds')
            .attr('transform', 'translate(' + this.padding.left + ',' + this.padding.top + ')')
            .selectAll('.cloud')
            .data(this.newdatasets)

        this.domClouds.exit().remove()

        this.domClouds
            .enter()
                .append('g')
                .attr('class', 'cloud')

        this.domClouds.each((datum: any, index: number) => {
            console.log(index)
            var domPoints = this.domClouds
                .selectAll('.rect-' + index)
                .data(datum)

            domPoints.exit().remove()

            domPoints.enter()
                    .append('rect')
                    .attr('class', 'rect rect-' + index)
                .merge(domPoints)
                    .attr('x', (d: any) => this.xScale(d.x) + index*this.barPadding)
                    .attr('y', (d: any) => this.yScale(d.y[index]))
                    .attr('height', (d:any) => this.yScale(this.ymax-d.y[index]+this.ymin))
                    .attr('width', this.barPadding)
                    .attr('fill', this.props.colors[index % this.props.colors.length])
                    .on('click', this.changeMode)
                }
            )
    }

    changeMode() {
        this.change = true
        this.setState({stacking: !this.state.stacking})
    }


    renderBarStack() {
        this.barPadding = _.max([Math.ceil(this.lineDimensions.width/this.datasets[0].length/1.1)-2, 1])
        this.domClouds = this.domContainer.select('.clouds')
            .attr('transform', 'translate(' + this.padding.left + ',' + this.padding.top + ')')
            .selectAll('.cloud')
            .data(this.newdatasets)

        this.domClouds.exit().remove()

        this.domClouds
            .enter()
                .append('g')
                .attr('class', 'cloud')
                .on('click', this.changeMode)

        this.domClouds.each((datum: any, index: number) => {
            var prevsum = (d:any) =>{
                var s = 0
                for(var k = 0; k<index; k++){
                    s+=d.y[k]
                }
                return s
            }
            var domPoints = this.domClouds
                .selectAll('.rect-' + index)
                .data(datum)

            domPoints.exit().remove()

            domPoints.enter()
                    .append('rect')
                    .attr('class', 'rect rect-' + index)
                .merge(domPoints)
                    .attr('x', (d: any) => this.xScale(d.x))
                    .attr('y', (d: any) => this.yScale(d.y[0] + prevsum(d)))
                    .attr('height', (d:any) => this.yScale(this.ymax-d.y[0]+this.ymin))
                    .attr('width', this.barPadding)
                    .attr('fill', this.props.colors[index % this.props.colors.length])
                }
            )
    }

    transitionStacked() {
        this.barPadding = _.max([Math.ceil(this.lineDimensions.width/this.datasets[0].length/1.1)-2, 1])
        this.xScale = d3.scaleLinear()
            .domain([this.xmin, this.xmax])
            .range([0, this.lineDimensions.width])

        this.yScale = d3.scaleLinear()
            .domain([this.ymin, this.ymax])
            .range([this.lineDimensions.height, 0])

        this.domClouds.each((datum: any, index: number) => {
            var prevsum = (d:any) =>{
                var s = 0
                for(var k = 0; k<index; k++){
                    s+=d.y[k]
                }
                return s
            }
            var domPoints = this.domClouds
                .selectAll('.rect-' + index)
                .transition()
                .duration(500)
                .delay(function(d:any, i:any) { return i * 10; })
                    .attr("y", (d:any) => this.yScale(d.y[index] + prevsum(d)))
                    .attr("height", (d:any) => this.yScale(this.ymax-d.y[index]+this.ymin))
                .transition()
                    .attr("x", (d: any) => this.xScale(d.x))
                    .attr("width", this.barPadding);
                }
            )
        }

    transitionGrouped() {
        this.barPadding = _.max([Math.ceil(this.lineDimensions.width/this.datasets[0].length/(.1 + this.numberDatasets))-2, 1])
        this.xScale = d3.scaleLinear()
            .domain([this.xmin, this.xmax])
            .range([0, this.lineDimensions.width])

        this.yScale = d3.scaleLinear()
            .domain([this.ymin, this.ymax])
            .range([this.lineDimensions.height, 0])

        this.domClouds.each((datum: any, index: number) => {
            var domPoints = this.domClouds
                .selectAll('.rect-' + index)
                .transition()
                    .duration(500)
                    .delay(function(d:any, i:any) { return i * 10; })
                    .attr('x', (d: any) => this.xScale(d.x) + index*this.barPadding)
                    .attr('width', this.barPadding)
                .transition()
                    .attr('y', (d: any) => this.yScale(d.y[index]))
                    .attr('height', (d:any) => this.yScale(this.ymax-d.y[index]+this.ymin))
                }
            )
        }



    renderD3DomElements(stacking: boolean) {
        this.renderAxes()
        if(!this.change){
            if(stacking){
                this.renderBarStack()
            }else {
                this.renderBarSide()
            }
        }else{
            if(stacking){
                this.transitionStacked()
            }else {
                this.transitionGrouped()
            }
        }

    }

    // REACT LIFECYCLE

    constructor(props: Props) {
        super(props)
        this.state = {stacking: false}
        this.changeMode = this.changeMode.bind(this);
        this.change = false
    }

    componentDidMount() {
        this.domContainer = d3.select(this.refs.container)
        this.setState({stacking: false})
        this.updateAttributes()
        this.renderD3DomElements(this.state.stacking)
    }

    shouldComponentUpdate(nextProps: Props, nextState: State) {
        if (nextProps.version === this.props.version && nextState.stacking === this.state.stacking) {
            return false
        }
        return true
    }

    componentDidUpdate() {
        this.updateAttributes()
        this.renderD3DomElements(this.state.stacking)
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
                <g className={'clouds'}></g>
            </svg>
        )
    }
}
