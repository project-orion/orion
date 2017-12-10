import * as d3 from 'd3'

export function wrap(width=100, texts: any) {
    // TODO: investigate why function() {} and () => {}
    // don't yield the same value for `this`...
    texts.each(function() {
        let text = d3.select(this as any),
            words = text.text().split(/\s+/).reverse(),
            word,
            line: any= [],
            lineNumber = 0,
            lineHeight = 1,
            x = text.attr('x') ? text.attr('x') : 0,
            y = text.attr('y') ? text.attr('y') : 0,
            dy = isNaN(parseFloat(text.attr('dy'))) ? 0 : parseFloat(text.attr('dy')),
            tspan = text
                .text(null)
                    .append('tspan')
                        .attr('x', 0)
                        .attr('y', y)
                        .attr('dy', dy + 'em')

        while (word = words.pop()) {
            line.push(word)
            tspan.text(line.join(' '))
            var node: any = tspan.node()
            var hasGreaterWidth = node.getComputedTextLength() > width
            if (hasGreaterWidth) {
                line.pop()
                tspan.text(line.join(' '))
                line = [word]
                tspan = text
                    .append('tspan')
                    .attr('x', 0)
                    .attr('y', y)
                    .attr('dy', ++lineNumber * lineHeight + dy + 'em')
                    .text(word)
            }
        }
    })
}
