var classNames = require('classnames');
var React = require('react');

require('./deck.scss');

var Deck = function (props) {
    return (
        <div className={classNames(['deck', props.className])}>
            <div className="inner">
                <a
                    aria-label="Scratch"
                    href="/"
                >
                    <img
                        className="logo"
                        src="/images/logo_sm.png"
                    />
                </a>
                {props.children}
            </div>
        </div>
    );
};
Deck.propTypes = {
    children: React.PropTypes.node,
    className: React.PropTypes.string
};
module.exports = Deck;
