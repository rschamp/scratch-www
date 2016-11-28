var classNames = require('classnames');
var React = require('react');

require('./accordion.scss');

class Accordion extends React.Component {
    constructor (props) {
        super(props);
        this.state = {
            isOpen: false
        };
    }
    handleClick (e) {
        e.preventDefault();
        this.setState({isOpen: !this.state.isOpen});
    }
    render () {
        var classes = classNames({
            content: true,
            open: this.state.isOpen
        });
        return (
            <div className="accordion">
                <this.props.titleAs
                    className="title"
                    onClick={this.handleClick}
                >
                    {this.props.title}
                </this.props.titleAs>
                <this.props.contentAs className={classes}>
                    {this.props.content}
                </this.props.contentAs>
            </div>
        );
    }
}

Accordion.propTypes = {
    content: React.PropTypes.node,
    title: React.PropTypes.string
};

Accordion.defaultProps = {
    contentAs: 'div',
    titleAs: 'div'
};

module.exports = Accordion;
