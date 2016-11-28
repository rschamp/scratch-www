var classNames = require('classnames');
var React = require('react');

require('./card.scss');

var Card = function (props) {
    return (
        <div className={classNames(['card', props.className])}>
            {props.children}
        </div>
    );
};
Card.propTypes = {
    children: React.PropTypes.node,
    className: React.PropTypes.string
};
module.exports = Card;
