import {useState} from 'react';

export const useCounter = (initialValue = 0, minValue = 0, maxValue = Infinity) => {

    const [counter, setCounter] = useState(initialValue);

    const countIncrement = () => {
        if (counter < maxValue) {
            console.log("Inside increment")
            setCounter(counter + 1);
            console.log(counter)
        }
    }

    const countDecrement = () => {
        if (counter > minValue) {
            setCounter(counter - 1);
        }
    }

    const reset = () => setCounter(initialValue);

    return {
        counter,
        countIncrement,
        countDecrement,
        reset,
    };
}