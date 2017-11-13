import * as d3 from 'd3'

export function rebind(target: any, source: any, method: any) {
    return (
        (...args: any[]) => {
            let value = method.apply(source, args)
            return value === source ? target : value
        }
    )
}

export function interceptClick() {
    let dispatcher: any = d3.dispatch(
        'customClick',
        'customDragStarted',
        'customDragging',
        'customDragEnd',
        'customDoubleClick'
    )

    let customClick : any = (selection: any): any => {
        let lastMouseDownLocation: any
        let lastMouseDownTime: any
        let lastMouseDownArguments: any

        // The click has to be localized so that one knows it's not a drag.
        let movementTolerance = 5
        let doubleClickSpeed = 200
        let windowTimeout: any

        let distance = (a: any, b: any): number => Math.pow(a[0] - b[0], 2) + Math.pow(a[1] - b[1], 2)

        selection.on('mousedown', (...args: any[]) => {
            lastMouseDownLocation = d3.mouse(document.body)
            lastMouseDownTime = +new Date()
            lastMouseDownArguments = args
        })

        selection.on('mouseup', (...args: any[]) => {
            if (distance(lastMouseDownLocation, d3.mouse(document.body)) > movementTolerance) {
                return
            } else {
                if (windowTimeout) {
                    window.clearTimeout(windowTimeout)
                    windowTimeout = null
                    dispatcher.apply('customDoubleClick', this as any, lastMouseDownArguments)
                } else {
                    windowTimeout = window.setTimeout((() => {
                        return () => {
                            dispatcher.apply('customClick', this as any, lastMouseDownArguments)
                            windowTimeout = null
                        }
                    })(), doubleClickSpeed)
                }
            }
        })
    }

    customClick['on'] = this.rebind(customClick, dispatcher, dispatcher['on'])

    return customClick
}
