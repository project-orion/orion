import * as _ from 'lodash'
import * as d3 from 'd3'
import * as React from 'react'
import * as ReactDOM from 'react-dom'

import './bubble-graph.less'

interface Props {
    version: any,
    nodes: any,
    width: number,
    height: number,
    colors: string[],
}

interface State {
    selected: any,
}

export class Component extends React.Component<Props, State> {
    // D3

    width: number
    height: number
    simulation: any

    refs: any
    circles: any
    texts: any
    info: any
    lines: any
    container: any
    nodes : any

    calculateData() {
        let {nodes} = this.props

        this.nodes = nodes

        function ticked() {
            this.container.selectAll('.bubble-graph-node')
                .attr("cx", function(d: any) { return d.x; })
                .attr("cy", function(d: any) { return d.y; })

            this.container.selectAll('.bubble-graph-label')
                .attr("x", function(d: any) { return d.x; })
                .attr("y", function(d: any) { return d.y; })
         }


        this.simulation.nodes(this.nodes).on('tick', ticked.bind(this))
    }

    renderNodes() {
        function dragstarted(d: any) {
            if (!d3.event.active) this.simulation.alphaTarget(0.1).restart()
            d.fx = d.x
            d.fy = d.y
        }

        function dragged(d: any) {
            d.fx = d3.event.x
            d.fy = d3.event.y
        }

        function dragended(d: any) {
            if (!d3.event.active) this.simulation.alphaTarget(0)
            d.fx = null
            d.fy = null
        }

        function mouseon(d: any) {
            d.attr('opacity',1)
        }

        function mouseout(d: any) {
            d.attr('opacity',0)
        }

        this.circles = this.container.selectAll('circle')
            .data(this.nodes, (d: any) => d.key);
        // exit
        this.circles.exit().remove();
        // enter + update

        this.circles = this.circles.enter().append('circle')
            .classed('bubble-graph-node', true)
            .merge(this.circles)
            .attr('cx', (d: any) => d.x)
            .attr('cy', (d: any) => d.y)
            .attr('r', (d: any) => Math.sqrt(Math.sqrt(d.data1.value/18624475))*50)
            .attr('fill', (d: any, i: number) => this.props.colors[i % this.props.colors.length])
            .attr('stroke', '#FFF')
            .attr('stroke-width', 1)
            .attr('opacity', (d: any) => 1)
            .call(d3.drag()
                .on('start', dragstarted.bind(this))
                .on('drag', dragged.bind(this))
                .on('end', dragended.bind(this)))
            .on("mouseover", this.selectNode)
        	.on("mouseout", this.unselectNode.bind(this));

    }

    renderLabels() {
        this.texts = this.container.selectAll('text')
            .data(this.nodes, (d: any) => d.key);
        // exit
        this.texts.exit().remove();
        // enter + update
        this.texts = this.texts.enter().append('text')
            .classed('bubble-graph-label', true)
            .merge(this.texts)
            .attr('x', (d: any) => d.x)
            .attr('y', (d: any) => d.y)
            .text((d: any) => { return d.data2.label })
    }

    renderInfo() {
        this.info = this.container.append('info')
            .classed('bubble-graph-etiquette', true)
            .attr('x', (!this.state.selected) ?  '0' : this.state.selected.x + 20)
            .attr('y', (!this.state.selected) ?  '0' : this.state.selected.y + 20)
            .text((!this.state.selected) ?  'Ici les infos' : this.state.selected.data2.label)
    }



    selectNode(node: any) {
            this.setState({selected: node})
    }

    unselectNode(node: any) {
            this.setState({selected: null})
    }

    // REACT LIFECYCLE
    constructor(props: Props) {
        super(props);
        this.state = {selected: null}

        this.selectNode = this.selectNode.bind(this);
    }

    shouldComponentUpdate(nextProps: Props, nextState: State) {
        if (nextProps.version === this.props.version) {

            // if version is the same, no updates to data
            // so it must be interaction to select + highlight a node
            this.circles.attr('opacity', (d: any) =>
            (!nextState.selected || d.index == nextState.selected.index || d.data1.label == "France") ? 1 : 0.2)
            this.texts.attr('opacity', (d: any) =>
            (!nextState.selected || d.index == nextState.selected.index || d.data1.label == "France") ? 1 : 0.1)
            this.renderInfo()
            return false
        }
        return true
    }

    componentDidMount() {
        this.container = d3.select(this.refs.container)
        this.width = this.props.width
        this.height = this.props.height
        this.simulation = d3.forceSimulation()
            .force('collide', d3.forceCollide().radius((d: any) => Math.sqrt(Math.sqrt(d.data1.value/17946996))*50).strength(1).iterations(40))
            .force('y', d3.forceY().strength(.3).y(this.height / 2))
            .force('x', d3.forceX().strength(.7).x((d: any) => (d.data2.value) * this.height / 10 + this.width / 3))

        this.calculateData()
        this.renderNodes()
        this.renderLabels()
        this.renderInfo()

    }

    componentDidUpdate() {
        this.calculateData()
        this.renderNodes()
        this.renderLabels()
        this.renderInfo()
        this.simulation.restart()
    }

    render() {
        let {width, height} = this.props

        return (
            <svg
                ref='container'
                width={width}
                height={height}
            ></svg>
        )
    }
}
