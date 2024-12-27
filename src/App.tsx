import './App.css'
import { useState, useEffect } from 'react';
import { Duration } from 'luxon';

enum AppMode {
configuring,
roundrest,
setuprest,
exerciserest,
running,
paused,
completed
}
interface AppState {
    mode: AppMode;
    last_mode: AppMode;
    round: number,
    exercise: number,
    activity_active_time: number,
    total_active_time: number,
    peroid_length: number,
}
interface ExerciseConfig {
    name: string,
    time_sec: number
}
interface WorkoutConfig {
    exercises: ExerciseConfig[]
    setup_rest: number,
    exercise_rest: number
    round_rest: number,
    total_rounds: number
}

function App() {
    const [appState, setAppState] = useState<AppState>({
        mode: AppMode.configuring,
        last_mode: AppMode.completed,
        round: 0,
        exercise: 0,
        activity_active_time: 0,
        total_active_time: 0,
        peroid_length: 0,
    })
    const [exercises, setExercises] = useState<WorkoutConfig>({
      exercises: [
        {name: "running", time_sec: 12},
        {name: "sit-ups", time_sec: 6},
        {name: "push-ups", time_sec: 6},
      ],
      setup_rest: 10,
      exercise_rest: 5,
      round_rest: 10,
      total_rounds: 4,
    });
    const toggleTimer = () => {
        setAppState((oldState) => { 
            if(oldState.mode === AppMode.paused) {
                return {...oldState, mode: oldState.last_mode, last_mode: AppMode.paused};
            } else {
                return {...oldState, mode: AppMode.paused, last_mode: oldState.mode};
            }
        })
    }
    const reconfigure = () => {
        setAppState({...appState,mode:AppMode.configuring, last_mode:appState.mode});
    }
    const restartCurrentExercise = () => {
        //TODO make this restart the current exercise
        setAppState({...appState,mode:AppMode.configuring, last_mode:appState.mode});
    }
    const speak = (words: string) => {
        const synth = window.speechSynthesis;
        const utterThis = new SpeechSynthesisUtterance(words)
        synth.speak(utterThis);
    }

    const tick = (appState: AppState) => {
        //if we ticked unexpected, don't do anything else
        if([AppMode.configuring, AppMode.completed, AppMode.paused].indexOf(appState.mode) != -1) return;

        const newAppState = {...appState};
        newAppState.activity_active_time += 1;
        newAppState.total_active_time += 1;
        if(newAppState.peroid_length - newAppState.activity_active_time == 1) {
            speak("1");
        }
        if(newAppState.peroid_length - newAppState.activity_active_time == 2) {
            speak("2");
        }
        if(newAppState.peroid_length - newAppState.activity_active_time == 3) {
            speak("3");
        }
        if(newAppState.peroid_length - newAppState.activity_active_time == 15) {
            speak("15");
        }
        if(newAppState.peroid_length - newAppState.activity_active_time == 30) {
            speak("30");
        }
        if(newAppState.peroid_length - newAppState.activity_active_time <= 0) {
            newAppState.activity_active_time = 0;
            switch(appState.mode) {
                case AppMode.running:
                    newAppState.last_mode = AppMode.running;
                    newAppState.exercise += 1;
                    if(newAppState.exercise === exercises.exercises.length) {
                        newAppState.round += 1;
                        newAppState.exercise = 0;
                        if(newAppState.round === exercises.total_rounds) {
                            newAppState.mode = AppMode.completed;
                            speak("You're done!")
                            newAppState.peroid_length = 0;
                            newAppState.round = 0;
                        } else {
                            newAppState.mode = AppMode.roundrest;
                            speak("long rest")
                            newAppState.peroid_length = exercises.round_rest;
                        }
                    } else {
                        speak("short rest")
                        newAppState.mode = AppMode.exerciserest;
                        newAppState.peroid_length = exercises.exercise_rest;
                    }
                    break;
                case AppMode.setuprest:
                    newAppState.mode = AppMode.running;
                    newAppState.last_mode = AppMode.setuprest;
                    newAppState.exercise = 0;
                    newAppState.round = 0;
                    newAppState.peroid_length = exercises.exercises[newAppState.exercise].time_sec;
                    speak(exercises.exercises[newAppState.exercise].name);
                    break;
                case AppMode.exerciserest:
                    newAppState.mode = AppMode.running;
                    newAppState.last_mode = AppMode.exerciserest;
                    newAppState.peroid_length = exercises.exercises[newAppState.exercise].time_sec;
                    speak(exercises.exercises[newAppState.exercise].name);
                    break;
                case AppMode.roundrest:
                    newAppState.mode = AppMode.running;
                    newAppState.last_mode = AppMode.roundrest;
                    newAppState.peroid_length = exercises.exercises[newAppState.exercise].time_sec;
                    speak(exercises.exercises[newAppState.exercise].name);
                    break;
            }
        }
        setAppState(newAppState);
    }
    const startingMode = () => {
        if(exercises.setup_rest == 0) {
            return AppMode.running;
        } else {
            return AppMode.setuprest;
        }
    }
    const startingPeroid = () => {
        if(exercises.setup_rest === 0) {
            return exercises.exercises[0].time_sec;
        } else {
            return exercises.setup_rest;
        }
    }


    switch(appState.mode) {
        case AppMode.configuring:
            return <ConfigureWorkout exercises={exercises} configureExercises={setExercises} finishConfiguring={() => {
                speak(''); // appease Apple Safari on Mobile
                setAppState({
                    ...appState,
                    mode: startingMode(),
                    last_mode: AppMode.configuring,
                    activity_active_time: 0,
                    total_active_time: 0,
                    peroid_length: startingPeroid()
                })
            }} />;
        case AppMode.paused:
        case AppMode.roundrest:
        case AppMode.exerciserest:
        case AppMode.setuprest:
        case AppMode.running:
            return <DoWorkout 
                exercises={exercises} 
                current={appState} 
                toggleTimer={toggleTimer}
                reconfigure={reconfigure}
                restartCurrentExercise={restartCurrentExercise}
                tick={tick}
                />
        case AppMode.completed:
            return <WorkoutCompleted reset={reconfigure}/>
    }
}

interface WorkoutCompleteProps{
    reset: () => void
}
function WorkoutCompleted({reset}: WorkoutCompleteProps) {
    return (<div className="finishedWorkout">
        <h1>🎉You did it🎉</h1>
        <button onClick={() => reset()}>Do it again</button>
    </div>)
}

interface ConfigureWorkoutProps {
    exercises: WorkoutConfig
    finishConfiguring: () => void,
    configureExercises: (config:WorkoutConfig) => void,
}
function ConfigureWorkout({exercises, configureExercises, finishConfiguring}: ConfigureWorkoutProps) {
    const updateCount = (restType: string, value: number) => {
        if (isNaN(value)) return;
        const newExercises = {...exercises};
        switch(restType) {
            case "round":
                newExercises.round_rest = value;
                break;
            case "exercise":
                newExercises.exercise_rest = value;
                break;
            case "setup":
                newExercises.setup_rest = value;
                break;
            case "num_rounds":
                newExercises.total_rounds = value;
                break;
        }
        configureExercises(newExercises);
    }
    const addExercise = () => {
        const newExercises = {...exercises};
        newExercises.exercises.push({name: "burpees", time_sec: 60});
        configureExercises(newExercises);
    }
    const updateExerciseName = (idx: number, value: string) => {
        const newExercises = {...exercises};
        newExercises.exercises[idx].name = value;
        configureExercises(newExercises);
    }
    const updateExerciseTime = (idx: number, value: number) => {
        const newExercises = {...exercises};
        newExercises.exercises[idx].time_sec = value;
        configureExercises(newExercises);
    }
    const removeExercise = (idx: number) => {
        const newExercises = {...exercises};
        newExercises.exercises.splice(idx, 1);
        configureExercises(newExercises);
    }
    return (<>
        <div className="configureWorkout">
            <h1>Let's Go</h1>
            <label htmlFor="setuprest">Setup Time {exercises.setup_rest}s</label><input id="setuprest" type="range" min="0" max="1200" step="5" value={exercises.setup_rest} onChange={e => updateCount("setup", parseInt(e.target.value))}/>
            <label htmlFor="roundrest">Rest Between Rounds {exercises.round_rest}s</label><input id="roundrest" type="range" min="0" max="1200" step="5" value={exercises.round_rest} onChange={e => updateCount("round", parseInt(e.target.value))} />
            <label htmlFor="exerciserest">Rest Between Exercises {exercises.exercise_rest}s</label><input id="exerciserest" type="range" min="0" max="1200" step="5" value={exercises.exercise_rest} onChange={e => updateCount("exercise", parseInt(e.target.value))}/>
            <label htmlFor="rounds">Rounds {exercises.total_rounds}</label><input id="rounds" type="range" min="1" max="60" step="1" value={exercises.total_rounds} onChange={e => updateCount("num_rounds", parseInt(e.target.value))}/>
            <div className="exercises">
            <h2>Exercises</h2>
            <ol >
            {exercises.exercises.map((e: ExerciseConfig, idx: number) => {
                    return (<li key={idx}>
                            <input type="text" className="name" value={e.name} onChange={(evt) => updateExerciseName(idx, evt.target.value)} />
                            <input type="number" className="time" value={e.time_sec} onChange={(evt) => updateExerciseTime(idx, parseInt(evt.target.value))} />
                            <button onClick={() => removeExercise(idx)}>🗑️</button>
                            </li>);
                    })}
            </ol>
            <button onClick={addExercise}>Add Exercise</button>
            </div>

            <button className="submit" onClick={() => finishConfiguring()}>Workout</button>
        </div>
    </>)
}

interface DoWorkoutProps{
    exercises: WorkoutConfig,
    current: AppState,
    tick: (state: AppState) => void
    toggleTimer: () => void
    reconfigure: () => void
    restartCurrentExercise: () => void
}
function DoWorkout({exercises, current, toggleTimer, restartCurrentExercise, tick, reconfigure}: DoWorkoutProps) {

  useEffect(() => {
    if (current.mode !== AppMode.paused) {
        const interval = setInterval(() => {
            tick(current);
        }, 1000)
        return () => {
            clearInterval(interval);
        }
    }
  }, [current])

  //derived quantities
  const num_exercise = exercises.exercises.length;
  const total_time = (
    exercises.setup_rest + /*inital time*/
    exercises.total_rounds * (num_exercise - 1) * exercises.exercise_rest + /*rest after exercises*/
    (exercises.total_rounds - 1) * exercises.round_rest + /*rest after rounds*/
    (exercises.total_rounds * exercises.exercises.reduce((acc, cur: ExerciseConfig) => acc+cur.time_sec, 0)) /*active time*/
    );
  const total_time_remaining = Duration.fromObject({seconds: total_time - current.total_active_time});
  const exercise_time_remaining = Duration.fromObject({seconds: current.peroid_length - current.activity_active_time});
  const timer_symbol = (() => { switch(current.mode) {
    case AppMode.running:
    case AppMode.exerciserest:
    case AppMode.roundrest:
    case AppMode.setuprest:
        return "⏸️";
    case AppMode.paused:
        return "▶️";
    }
  })();
  const activity = (() => { switch(current.mode) {
    case AppMode.running:
        return exercises.exercises[current.exercise].name;
    case AppMode.exerciserest:
        return "Short Rest";
    case AppMode.roundrest:
        return "Long Rest";
    case AppMode.setuprest:
        return "Setup";
    case AppMode.paused:
        return "Paused";
    }
  })();


  return (
    <div className="doWorkout">
        <div className="status">
            <h1>{activity}</h1>
            <div>
                <span>
                    <p>Exercise</p><p>{current.exercise}/{num_exercise}</p>
                </span>
                <span>
                    <p>Round</p>
                    <p>{current.round}/{exercises.total_rounds}</p>
                </span>
            </div>
        </div>
        <div className="timer">
            <h1>{exercise_time_remaining.toFormat("mm:ss")}</h1>
            <h2>{activity}</h2>
        </div>
        <div className="controls">
            <p onClick={reconfigure}>⏹️</p>
            <p onClick={toggleTimer}>{timer_symbol}</p>
            <p onClick={restartCurrentExercise}>⏮️</p>
        </div>
        <div className="totalremaining">
            <p>Time Remaining {total_time_remaining.toFormat("mm:ss")} </p>
        </div>
    </div>
  );
}

export default App
