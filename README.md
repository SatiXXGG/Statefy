
NOT generated with chatgpt 💔

Statefy<T> Class Documentation
typescript
export class Statefy<T>
A generic state management class that handles both persistent and temporary states with lifetime tracking and callback notifications.

Properties

override: boolean

If true, allows setting the same state value repeatedly (bypasses change check)
Default: false
listStateRewrite: boolean

If true, adding an existing state to the list resets its lifetime
Default: true
Constructor

constructor(defaultState: T)

Creates a new Statefy instance

defaultState: Initial state value
Methods

get(): T

Returns current state (prioritizes temporal state if set)
Returns: Current state value
add(state: T, lifeTime: number): void

Adds a temporary state to the state list

state: State value to add
lifeTime: Duration in seconds before automatic removal
remove(state: T): void

Removes a state from the state list

state: State value to remove
getListStates(): Set<T>

Gets all active states in the list (within their lifetime)

Returns: Set of active states
listHasState(state: T): boolean

Checks if a state exists in the active list

state: State value to check
Returns: true if state exists and is active
set(state: T): void

Sets the persistent base state

state: New state value
(Ignores if same as current and override=false)
setTemporal(state: T, time: number): void

Sets a temporary override state

state: Temporary state value
time: Duration in seconds before reverting
Events

onChange(callback: (newState: T, oldState: T) => void): { clear: () => void }

Registers callback for base state changes

callback: Function to execute on change
Returns: Clear function to remove callback
onAdd(callback: (state: T) => void): { clear: () => void }

Registers callback when states are added to list

callback: Function to execute on add
Returns: Clear function to remove callback
onRemove(callback: (state: T) => void): { clear: () => void }

Registers callback when states are removed from list

callback: Function to execute on remove
Returns: Clear function to remove callback
Usage Example

typescript
const playerState = new Statefy<"Idle" | "Moving">("Idle");

playerState.onChange((newState, oldState) => {
    print(`State changed: ${oldState} → ${newState}`);
});

playerState.add("Jumping", 2); // Temporary state for 2 seconds
playerState.set("Moving"); // Persistent state change
