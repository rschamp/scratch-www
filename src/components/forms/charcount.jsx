var classNames = require('classnames');
var React = require('react');

require('./charcount.scss');

var CharCount = function (props) {
    var classes = classNames(
        'char-count',
        props.className,
        {overmax: (props.currentCharacters > props.maxCharacters)}
    );
    return (
        <p className={classes}>
            {props.currentCharacters}/{props.maxCharacters}
        </p>
    );
};
CharCount.propTypes = {
    className: React.PropTypes.string,
    currentCharacters: React.PropTypes.number,
    maxCharacters: React.PropTypes.number
};
CharCount.defaultProps = {
    currentCharacters: 0,
    maxCharacters: 0
};
module.exports = CharCount;
