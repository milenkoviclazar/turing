// TODO: add code editor
// TODO: add boxes to create blocks

var cy = cytoscape({
    container: document.querySelector('#cy'),

    boxSelectionEnabled: false,
    autounselectify: false,

    style: cytoscape.stylesheet()
        .selector('node')
        .css({
            'content': 'data(label)',
            'shape': function (ele) {
                return (ele.data('accepting') === 'true') ? 'octagon' : 'ellipse';
            },
            'text-valign': 'center',
            'color': '#000',
            'background-color': '#999',
            'text-size': '1'
        })
        .selector('edge')
        .css({
            'label': function (ele) {
                return "(" + "'" + ele.data('symbol') + "'" + ", " + ele.data('direction') + ")"
            },
            'font-size': 10,
            'text-rotation': 'autorotate',
            'curve-style': 'bezier',
            'target-arrow-shape': 'triangle-backcurve',
            'line-color': '#ccc',
            'target-arrow-color': '#ccc',
            'line-style': 'solid',
            'width': 1
        })
        .selector('.highlighted')
        .css({
            'background-color': '#61bffc',
            'transition-property': 'background-color',
            'transition-duration': '100'
        })
        .selector(':selected')
        .css({
            'border-width': '2'
        }),

    elements: {
        nodes: [{
            // TODO: what should be the shape of the first element if it's accepting?
            data: {id: '0', label: 'q0', accepting: 'false'},
            grabbable: false,
            css: {
                'shape': 'rectangle'
            }
        },
            {data: {id: '1', label: 'q1', accepting: 'false'}}
        ],
        edges: [
            {data: {source: '0', target: '1', symbol: '0', direction: 'R'}}
        ]
    },
    layout: {
        name: 'grid',
        padding: 30
    }
});

// create node on long background tap
cy.on('taphold', function (e) {
    if (e.cyTarget !== cy) {
        return;
    }
    var id = '' + cy.$('node').size() + '';
    var newNode = cy.add({
        group: "nodes",
        data: {id: id, label: '', accepting: 'false'},
        position: {x: e.cyPosition.x, y: e.cyPosition.y}
    });
    setNodeQtip(newNode);
    newNode.qtip('api').show();
});

cy.on('select', 'edge', function (e) {
    cy.nodes().unselect();
});


cy.on('taphold', 'node', function (e) {
    var node = e.cyTarget;
    createEdge(node, node);
    cy.elements().unselect();
    // TODO: prevent qtip from appearing here
});

// create edge when second node is selected
cy.on('select', 'node', function (e) {
    var selection = cy.$(':selected');
    if (selection.size() != 2) {
        return;
    }
    var sourceNode = selection[0];
    var targetNode = selection[1];
    if (targetNode.id() != e.cyTarget.id()) {
        var t = sourceNode;
        sourceNode = targetNode;
        targetNode = t;
    }
    selection.unselect();
    createEdge(sourceNode, targetNode);
});

cy.nodes().forEach(function (n) {
    setNodeQtip(n);
});

cy.edges().forEach(function (e) {
    setEdgeQtip(e);
});

function createEdge(sourceNode, targetNode) {
    var outgoingEdges = sourceNode.edgesTo(targetNode);
    if (outgoingEdges.length == 3) {
        // this is to prevent nondeterminism
        return;
    }
    var possibleSymbols = [' ', '0', '1'];
    for (var i = 0; i < outgoingEdges.length; i++) {
        var idx = possibleSymbols.indexOf(outgoingEdges[i].data('symbol'));
        possibleSymbols.splice(idx, 1);
    }
    var newEdge = cy.add({
        data: {source: sourceNode.id(), target: targetNode.id(), symbol: possibleSymbols[0], direction: 'L'}
    });
    setEdgeQtip(newEdge);
    $(".qtip").qtip('hide');
}

function setNodeQtip(node) {
    var template = $('#qtip-node-template').clone();
    template.find('#node-name').prop('id', 'node-name-' + node.id());
    template.find('#node-accepting').prop('id', 'node-accepting-' + node.id());
    template.find('#delete-node').prop('id', 'delete-node-' + node.id());
    node.qtip({
        content: template.html(),
        position: {
            my: 'bottom center',
            at: 'center'
        },
        style: {
            classes: 'qtip-bootstrap'
        },
        events: {
            render: function (event, api) {
                var id = node.id();
                $('#node-name-' + id)
                    .val(node.data('label'))
                    .on('input', function () {
                        node.data()['label'] = this.value;
                        node.toggleClass('foo');
                    });
                /// TODO: focus the textfield when qtip is shown
                var accepting = node.data('accepting') === 'true';
                $('#node-accepting-' + id)
                    .prop('checked', accepting)
                    .change(function () {
                        node.data()['accepting'] = this.checked ? 'true' : 'false';
                        node.toggleClass('foo');
                    });
                $('#delete-node-' + id)
                    .click(function () {
                        cy.remove(node);
                        $(".qtip").qtip('hide');
                        cy.elements().unselect();
                    });
            }
        }
    });
}

function setEdgeQtip(e) {
    var template = $('#qtip-edge-template').clone();
    template.find('#edge-symbol').prop('id', 'edge-symbol-' + e.id());
    template.find('#edge-direction').prop('id', 'edge-direction-' + e.id());
    template.find('#delete-edge').prop('id', 'delete-edge-' + e.id());
    e.qtip({
        content: template.html(),
        position: {
            my: 'bottom center',
            at: 'center'
        },
        style: {
            classes: 'qtip-bootstrap'
        },
        events: {
            render: function (event, api) {
                var id = e.id();
                var edge = cy.$('#' + id);
                $('#edge-direction-' + id)
                    .val(edge.data('direction'))
                    .change(function () {
                        edge.data()['direction'] = this.value;
                        edge.toggleClass('foo');
                    });
                $('#edge-symbol-' + id)
                    .val(edge.data('symbol'))
                    .change(function () {
                        edge.data()['symbol'] = this.value;
                        edge.toggleClass('foo');
                    });
                $('#delete-edge-' + id)
                    .click(function () {
                        cy.remove(edge);
                        $(".qtip").qtip('hide');
                        cy.elements().unselect();
                    });
            }
        }
    });
}

$(document).keydown(function (e) {
    if (e.keyCode == 13) {
        $(".qtip").qtip('hide');
    }
});

var intervalID = -1;

$('#start-button').click(function () {
    var timeout = 2000 / $('#speed-controller').val();
    console.log(timeout);
    intervalID = setInterval(function () {
        Simulation.step()
    }, timeout);
});

$('#pause-button').click(function () {
    Simulation.pause();
});

$('#step-button').click(function () {
    Simulation.step();
});

$('#reset-button').click(function () {
    Simulation.reset();
});

// add initial tape state
$('#tape-input').val('0000000000000000000000');

$(window).resize(function () {
    cy.fit();
});

for (var i = 0; i < 11; i++) {
    $('#tape-peek').append('<input id="tape-peek-' + i + '" type="text" size="1">');
}
$('#tape-peek-5').css({"border": "2px solid #000000"});

Simulation = {
    tape: {
        idx: 0,
        content: {},
        move: function (direction) {
            if (direction === 'L') {
                this.idx--;
            } else {
                this.idx++;
            }
        },
        read: function () {
            return this.get(this.idx);
        },
        get: function (idx) {
            var ret = this.content['' + idx];
            if (ret === null) {
                return ' ';
            }
            return ret;
        },
        render: function () {
            for (var i = 0; i < 11; i++) {
                $('#tape-peek-' + i).val(this.get(this.idx - 5 + i));
            }
        }
    },
    currNode: null,
    init: function () {
        this.currNode = cy.$('#0');
        this.tape.content = document.getElementById('tape-input').value;
        this.tape.render();
    },
    step: function () {
        if (this.currNode == null) {
            this.init();
        } else {
            var outEdges = this.currNode.outgoers('edge');
            for (var i = 0; i < outEdges.length; i++) {
                if (outEdges[i].data('symbol') === this.tape.read()) {
                    this.tape.move(outEdges[i].data('direction'));
                    var nextId = outEdges[i].data('target');
                    this.currNode = cy.$('#' + nextId);
                    outEdges[i].toggleClass('foo');
                    break;
                }
            }
        }
        /// TODO: sometimes during the animation random nodes stay blue forever
        this.tape.render();
        cy.elements().removeClass('highlighted');
        this.currNode.addClass('highlighted');

        /// TODO: when stoped and played again after accepting, machine ignores accepting state and continues further
        if (this.currNode.data('accepting') === 'true') {
            $('#accept-message').show();
            this.pause();
        }
    },
    reset: function () {
        $('#accept-message').hide();
        this.currNode = null;
        this.tape.idx = 0;
        this.pause();
        cy.elements().removeClass('highlighted');
        cy.elements().toggleClass('foo');
    },
    pause: function () {
        clearInterval(intervalID);
    }
};