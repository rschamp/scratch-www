var React = require('react');

require('./footer.scss');

var FooterBox = function (props) {
    return (
        <div className="inner">
            {props.children}
        </div>
    );
};
FooterBox.propTypes = {
    children: React.PropTypes.node
};
module.exports = FooterBox;
