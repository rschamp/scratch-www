var range = require('lodash.range');
var React = require('react');

require('./spinner.scss');

var Spinner = React.createClass({
    // Adapted from http://tobiasahlin.com/spinkit/
    type: 'Spinner',
    render: function () {
        return (
            <div className="spinner">
                {range(1, 13).map(function (id) {
                    return <div className={'circle' + id + ' circle'} />;
                })}
            </div>
        );
    }
});

module.exports = Spinner;
