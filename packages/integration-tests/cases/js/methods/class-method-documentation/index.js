/**
 * Test for documentation of "arrow function methods."
 */

import React, { Component } from 'react';
import styled from 'styled-components';

/**
 * React component that display current time at current location.
 */
class Clock extends Component {

	constructor(props){
		super(props);
		const currentTime = new Date();
		this.state = this.getTime();
	}

	componentDidMount() {
		this.setTimer();
	}

	componentWillUnmount(){
		// Avoiding timeout still runs when component is unmounted
		if (this.timeOut) {
			clearTimeout(this.timeOut);
		}
	}

	/**
	 * Update clock state with new time
	 *
	 */
	updateClock = () => {
		const currentTime = this.getTime();
		this.setState(currentTime);
		this.setTimer();
	}

	/**
	 * Parse current Date object
	 *
	 * @returns {Object} currentTime
	 *    @returns {int} currentTime.hour
	 *    @returns {int} currentTime.minutes
	 *    @returns {string} currentTime.ampm "am" or "pm"
	 *    @returns {string} currentTime.dayOfWeek
	 *    @returns {string} currentTime.month
	 *    @returns {int} currentTime.date
	 */
	getTime = () => {
		const dateObject = new Date();
		const dateString = dateObject.toDateString().split(" ");
		const currentTime = {
			hours: dateObject.getHours(),
			minutes: dateObject.getMinutes(),
			seconds: dateObject.getSeconds(),
			ampm: dateObject.getHours() >= 12 ? 'pm' : 'am',
			dayOfWeek: dateString[0],
			month: dateString[1],
			date: dateString[2]
		};

		return currentTime;
	}

	/**
	 * Update current clock for every 1 second
	 *
	 */
	setTimer = () => {
		this.timeOut = setTimeout(()=> {
			this.updateClock()
		}, 1000);
	}

	render(){
		const {
			hours,
			minutes,
			seconds,
			ampm,
			dayOfWeek,
			month,
			date
		} = this.state;

		const ClockContainer = styled.div`
		color: #fff;
		font-size: xx-large;
		float: right;
		top: 1em;
		position: relative;
		`;

		return(
			<ClockContainer>
			{ this.props.title } <br />
			{ dayOfWeek }, { month } { date } <br/>
			{
				hours == 0 ? 12 :
				(hours >12) ? hours - 12 : hours
			}: {
				minutes > 9 ? minutes: `0${minutes}`
			}: {
				seconds > 9 ? seconds: `0${seconds}`
			} {ampm} <br/>

			</ClockContainer>
		);
	}
}

Clock.propTypes = {
	/** A text display current's user identity,
	 *  "Nobody" if no one is detected in the background,
	 *  "Hi, ..name" if an user is detected
	 */
	title: React.PropTypes.string
}

export default Clock;
