import React, { Component } from 'react';
import { 
    View,
    Animated,
    PanResponder,
    Dimensions,
    LayoutAnimation,
    UIManager
} from 'react-native';

const SCREEN_WIDTH = Dimensions.get('window').width;
const SWIPE_THRESHOLD = 0.25 * SCREEN_WIDTH;
const SWIPE_OUT_DURATION = 250;

export default class Deck extends Component {
    static defaultProps = {
        onSwipeRight: () => {},
        onSwipeLeft: () => {}
    }

    constructor(props) {
        super(props);

        const position = new Animated.ValueXY();
        const panResponder = PanResponder.create({
            // anytime user tap on screen, use panResponder to handle this gesture
            // callback for conditional handling
            onStartShouldSetPanResponder: () => true,
            // user drag around screen
            // callback will rum when screen dragged
            // gesture most important, whether user move, etc
            onPanResponderMove: (event, gesture) => {
                position.setValue({ x: gesture.dx, y: gesture.dy});
            },
            // user presses downs, lets go
            // great for finalized callbacks, when element action is done
            // user stop gesture
            onPanResponderRelease: (event, gesture) => {
                if (gesture.dx > SWIPE_THRESHOLD) {
                    this.forceSwipe('right');
                } else if (gesture.dx < -SWIPE_THRESHOLD) {
                    this.forceSwipe('left');
                } else {
                    this.resetPosition();
                }
            }
        });
        //this.panResponder = panResponder;
        //this.position = position;
        this.state = { panResponder, position, index: 0 };
    }

    componentWillReceiveProps(nextProps) {
        if (nextProps.data !== this.props.data) {
            this.setState({ index: 0 });
        }
    }

    componentWillUpdate() {
        UIManager.setLayoutAnimationEnabledExperimental && UIManager.setLayoutAnimationEnabledExperimental(true);
        LayoutAnimation.spring();
    }

    forceSwipe(direction) {
        const x = direction === 'right' ? SCREEN_WIDTH : -SCREEN_WIDTH;
        // linear feeling animation, move directly there no animation
        Animated.timing(this.state.position, {
            toValue: { x, y: 0 },
            duration: SWIPE_OUT_DURATION
        }).start(() => this.onSwipeComplete(direction));
    }

    onSwipeComplete(direction) {
        const { onSwipeLeft, onSwipeRight, data } = this.props;
        const item = data[this.state.index];

        direction === 'right' ? onSwipeRight(item) : onSwipeLeft(item);
        this.state.position.setValue({ x: 0, y: 0 });
        this.setState({ index: this.state.index + 1 });
    }

    resetPosition() {
        Animated.spring(this.state.position, { 
            toValue: { x: 0, y: 0 }
        }).start();
    }

    getCardStyle() {
        const { position } = this.state;
        const rotate = position.x.interpolate({
            inputRange: [-SCREEN_WIDTH * 2, 0, SCREEN_WIDTH * 2],
            outputRange: ['-120deg', '0deg', '120deg'] 
        });

        return {
            ...this.state.position.getLayout(),
            transform: [{ rotate }]
        }
    }

    renderCards() {
        if (this.state.index >= this.props.data.length) {
            return this.props.renderNoMoreCards();
        }
        
        return this.props.data.map((item, i) => {
            if (i < this.state.index) { return null; }

            if (i === this.state.index) {
                return (
                    <Animated.View
                        key={item.id}
                        style={[this.getCardStyle(), styles.cardStyle, { zIndex: i * -1 }]}
                        {...this.state.panResponder.panHandlers}>
                        {this.props.renderCard(item)}
                    </Animated.View>
                )
            } 

            return (
                <View 
                    key={item.id} 
                    style={[styles.cardStyle, { top: 10 * (i - this.state.index) }, { zIndex: i * -1 }]}>
                    {this.props.renderCard(item)}
                </View>
            );
        });
    }

    render() {
        // many callbacks, spread all callbacks to view
        return (
            <Animated.View>
                {this.renderCards()}
            </Animated.View> 
        );
    }
}

const styles = {
    cardStyle: {
        position: 'absolute',
        width: SCREEN_WIDTH
    }
};