var classNames = require('classnames');
var React = require('react');

require('./flex-row.scss');

var FlexRow = function (props) {
    var classes = classNames(
        'flex-row',
        props.className
    );
    var as = props.as;
    return (
        <as className={classes}>
            {props.children}
        </as>
    );
};
FlexRow.propTypes = {
    as: React.PropTypes.string,
    children: React.PropTypes.node,
    className: React.PropTypes.string
};
FlexRow.defaultProps = {
    as: 'div'
};
module.exports = FlexRow;
