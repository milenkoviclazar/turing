var cy = cytoscape({
    container: document.querySelector('#cy'),

    boxSelectionEnabled: false,
    autounselectify: false,

    style: cytoscape.stylesheet()
        .selector('node')
        .css({
            'content': 'data(label)',
            'shape': 'ellipse',
            'text-valign': 'center',
            'color': '#000',
            'background-color': '#999',
            'text-size': '1'
        })
        .selector('edge')
        .css({
            'label': function (ele) {
                return "(" + ele.data('in') + " -> " + ele.data('out') + ", " + ele.data('direction') + ")"
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
        .selector('node[type="start"]')
        .css({
            'shape': 'triangle'
        })
        .selector('node[type="accept"]')
        .css({
            // TODO: fix them styles
            'shape': 'octagon'
        })
        .selector(':selected')
        .css({
            'border-width': '2'
        }),

    elements: {
        nodes: [
            {data: {id: '0', label: 'q0', type: 'start'}},
            {data: {id: '1', label: 'q1', type: 'normal'}},
            {data: {id: '2', label: 'q2', type: 'normal'}},
            {data: {id: '3', label: 'q3', type: 'normal'}},
            {data: {id: '4', label: 'q4', type: 'normal'}},
            {data: {id: '5', label: 'q5', type: 'accept'}},
        ],
        edges: [
            {data: {source: '0', target: '1', in: '0', out: '0', direction: 'R'}},
            {data: {source: '1', target: '2', in: '0', out: '0', direction: 'R'}},
            {data: {source: '2', target: '3', in: '0', out: '0', direction: 'R'}},
            {data: {source: '3', target: '4', in: '0', out: '0', direction: 'R'}},
            {data: {source: '4', target: '5', in: '0', out: '0', direction: 'R'}}
        ]
    },
    layout: {
        name: 'grid',
        padding: 30
    }
});

var newId = cy.$('node').size();

// create node on long background tap
cy.on('taphold', function (e) {
    if (e.cyTarget !== cy) {
        return;
    }
    var id = '' + newId;
    newId++;
    var newNode = cy.add({
        group: "nodes",
        data: {id: id, label: '', type: 'normal'},
        position: {x: e.cyPosition.x, y: e.cyPosition.y}
    });
    setNodeQtip(newNode);
    newNode.qtip('api').show();
});

cy.on('select', 'edge', function (e) {
    cy.nodes().unselect();
});

var taphold = false;

cy.on('taphold', 'node', function (e) {
    var node = e.cyTarget;
    createEdge(node, node);
    cy.elements().unselect();
    taphold = true;
});

// create edge when second node is selected
cy.on('select', 'node', function (e) {
    var selection = cy.$(':selected');
    if (selection.size() !== 2) {
        return;
    }
    var sourceNode = selection[0];
    var targetNode = selection[1];
    if (targetNode.id() !== e.cyTarget.id()) {
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

function getAvailableSymbols(node) {
    var outgoingEdges = node.outgoers('edge');
    var possibleSymbols = ['_', 'x', '0', '1'];
    for (var i = 0; i < outgoingEdges.length; i++) {
        possibleSymbols.splice(possibleSymbols.indexOf(outgoingEdges[i].data('in')), 1);
    }
    return possibleSymbols;
}

function createEdge(sourceNode, targetNode) {
    var symbols = getAvailableSymbols(sourceNode);
    if (symbols === null || symbols.length === 0) {
        return;
    }
    var newEdge = cy.add({
        data: {source: sourceNode.id(), target: targetNode.id(), in: symbols[0], out: 'x', direction: 'L'}
    });
    setEdgeQtip(newEdge);
    $(".qtip").qtip('hide');
}

function setNodeQtip(node) {
    var template = $('#qtip-node-template').clone();
    template.find('#node-name').prop('id', 'node-name-' + node.id());
    template.find('#node-type').prop('id', 'node-type-' + node.id());
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
                $('#node-type-' + id)
                    .val(node.data('type'))
                    .change(function () {
                        node.data()['type'] = this.value;
                        if (this.value === 'start' || this.value === 'accept') {
                            cy.nodes().forEach(function (n) {
                                if (n.id() !== node.id() && n.data()['type'] === node.data()['type']) {
                                    n.data()['type'] = 'normal';
                                    n.toggleClass('foo');
                                }
                            });
                        }
                        node.toggleClass('foo');
                    });
                $('#delete-node-' + id)
                    .click(function () {
                        cy.remove(node);
                        $(".qtip").qtip('hide');
                        cy.elements().unselect();
                    });
            },
            visible: function (event, api) {
                $('#node-name-' + node.id()).focus();
                if (taphold) {
                    taphold = false;
                    $(".qtip").qtip('hide');
                }
            }
        }
    });
}

function setEdgeQtip(edge) {
    var template = $('#qtip-edge-template').clone();
    template.find('#edge-input-symbol').prop('id', 'edge-input-symbol-' + edge.id());
    template.find('#edge-output-symbol').prop('id', 'edge-output-symbol-' + edge.id());
    template.find('#edge-direction').prop('id', 'edge-direction-' + edge.id());
    template.find('#delete-edge').prop('id', 'delete-edge-' + edge.id());
    edge.qtip({
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
                var id = edge.id();
                $('#edge-input-symbol-' + id)
                    .val(edge.data('in'))
                    .change(function () {
                        var symbols = getAvailableSymbols(edge.source());
                        if (symbols.indexOf(this.value) === -1) {
                            this.value = edge.data('in');
                        } else {
                            edge.data()['in'] = this.value;
                        }
                        edge.toggleClass('foo');
                    });
                $('#edge-output-symbol-' + id)
                    .val(edge.data('out'))
                    .change(function () {
                        edge.data()['out'] = this.value;
                        edge.toggleClass('foo');
                    });
                $('#edge-direction-' + id)
                    .val(edge.data('direction'))
                    .change(function () {
                        edge.data()['direction'] = this.value;
                        edge.toggleClass('foo');
                    });
                $('#delete-edge-' + id)
                    .click(function () {
                        cy.remove(edge);
                        $(".qtip").qtip('hide');
                        cy.elements().unselect();
                    });
            },
            visible: function (event, api) {
                $('#edge-input-symbol-' + edge.id()).focus();
            }
        }
    });
}

$(document).keydown(function (e) {
    if (e.keyCode === 13) {
        $(".qtip").qtip('hide');
    }
});

var intervalID = -1;

// TODO: fix button/machine state correlation
$('#start-button').click(function () {
    if ($(this).html().indexOf('play') > -1) {
        var timeout = 2000 / $('#speed-controller').val();
        intervalID = setInterval(function () {
            Simulation.step()
        }, timeout);
        $('.ctrl').prop('disabled', true);
        $(this).prop('disabled', false);
        $(this).html('<span class="glyphicon glyphicon-pause"></span>');
    } else {
        Simulation.pause();
        $('.ctrl').prop('disabled', false);
        $(this).html('<span class="glyphicon glyphicon-play"></span>');
    }
    $(this).blur();
});

$('#step-button').click(function () {
    $('.ctrl').prop('disabled', true);
    Simulation.step();
    setTimeout(function() {
        $('.ctrl').prop('disabled', false);
    }, 150);
    $(this).blur();
});

$('#reset-button').click(function () {
    Simulation.reset();
    $(this).blur();
});

// add initial tape state
$('#tape-input').val('0000000000000000000000');

$(window).resize(function () {
    cy.fit();
});

for (var i = 0; i < 11; i++) {
    // TODO: fit this to container width
    $('#tape-peek').append('<input id="tape-peek-' + i + '" type="text" size="1" disabled>');
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
        write: function (value) {
            return this.set(this.idx, value);
        },
        get: function (idx) {
            var ret = this.content['' + idx];
            if (ret === null) {
                return '_';
            }
            return ret;
        },
        set: function (idx, value) {
            this.content['' + idx] = value;
        },
        render: function () {
            for (var i = 0; i < 11; i++) {
                $('#tape-peek-' + i).val(this.get(this.idx - 5 + i));
            }
        }
    },
    currNode: null,
    init: function () {
        this.reset();
        this.currNode = cy.elements('node[type="start"]');
     },
    step: function () {
        if (this.currNode === null) {
            this.init();
        } else if (this.currNode.data('type') === 'accept') {
            this.accept();
            return;
        } else {
            var outEdges = this.currNode.outgoers('edge');
            var reject = true;
            for (var i = 0; i < outEdges.length; i++) {
                var edge = outEdges[i];
                if (edge.data('in') === this.tape.read()) {
                    this.tape.write(edge.data('out'));
                    this.tape.move(edge.data('direction'));
                    this.currNode = edge.target();
                    reject = false;
                    break;
                }
            }
            if (reject) {
                this.reject();
                return;
            }
        }
        this.tape.render();
        cy.elements().removeClass('highlighted');
        this.currNode.addClass('highlighted');
    },
    accept: function () {
        $('#accept-message').show();
        this.pause();
    },
    reject: function() {
        $('#accept-message').show();
    },
    reset: function () {
        $('#accept-message').hide();
        $('#reject-message').hide();
        this.currNode = null;
        cy.elements().removeClass('highlighted');
        cy.elements().toggleClass('foo');
        var str = document.getElementById('tape-input').value;
        this.tape.idx = 0;
        this.tape.content = {};
        for (var i = 0; i < str.length; i++) {
            this.tape.set(i, str[i]);
        }
        this.tape.render();
    },
    pause: function () {
        clearInterval(intervalID);
    }
};