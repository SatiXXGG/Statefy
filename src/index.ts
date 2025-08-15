
type StateCallback<T> = (New: T, old: T) => void
type StateListCallback<T> = (state: T) => void

interface StateInfo<T> {
	state: T
	createdAt: number
	lifetime: number
}

interface Collider<T> {
	checkState(): boolean
	checkList(): boolean
	check(): boolean
}


export class Statefy<T extends AttributeValue> {
	private currentState: T
	private changeCallbacks = new Set<StateCallback<T>>()
	private addCallbacks = new Set<StateListCallback<T>>()
	private removeCallbacks = new Set<StateListCallback<T>>()

	public override = false
	public listStateRewrite = true
	private temporal: T | undefined
	private temporalTick = tick()
	private stateList: StateInfo<T>[] = []
	/**
	 * Creates a new Statefy
	 * @param defaultState
	 */
	constructor(defaultState: T) {
		this.currentState = defaultState
	}
	/**
	 * Returns the current state
	 * Will return temporal state if set
	 * @returns
	 */
	get(): T {
		if (this.temporal) return this.temporal
		return this.currentState
	}

	/**
	 * Adds a state to the list, not to the current state
	 * @param state
	 * @param lifeTime
	 */
	add(state: T, lifeTime: number) {
		const found = this.stateList.find(s => s.state === state)
		const tc = tick()
		if (found && this.listStateRewrite) {
			found.createdAt = tc
			found.lifetime = lifeTime
		} else {
			const info: StateInfo<T> = {
				state,
				createdAt: tc,
				lifetime: lifeTime
			}
			this.stateList.push(info)
			this.addCallbacks.forEach(callback => task.spawn(() => callback(state as T)))
		}
	}

	/**
	 * Removes an element from the state list
	 * @param state
	 */

	remove(state: T) {
		const found = this.stateList.find(s => s.state === state)
		if (!found) return
		this.stateList = this.stateList.filter(s => s.state !== state)
		this.removeCallbacks.forEach(callback => task.spawn(() => callback(state)))
	}
	/**
	 * Cleans all the listeners of the callbacks
	 */

	clearAllListeners() {
		this.changeCallbacks.clear()
		this.addCallbacks.clear()
		this.removeCallbacks.clear()
	}

	/**
	 * Returns the list of states
	 * @returns
	 */


	getListStates() {
		const grabbedStates = new Set<T>()
		this.stateList.forEach(s => {
			if (tick() - s.createdAt <= s.lifetime) {
				grabbedStates.add(s.state)
			} else {
				this.remove(s.state)
			}
		})
		return grabbedStates
	}

	/**
	 * Returns if the list has the state
	 * @param state
	 * @returns
	 */

	listHasState(state: T) {
		return this.getListStates().has(state)
	}

	/**
	 * Changes the current state
	 * @param state
	 * @returns
	 */

	set(state: T) {
		if (!this.override && this.currentState === state) return
		const oldState = this.get()
		this.currentState = state
		this.changeCallbacks.forEach(callback => task.spawn(() => callback(state, oldState)))
	}

	/**
	 * Sets a temporal current state, NOT a list one
	 * @param state
	 * @param time
	 */

	setTemporal(state: T, time: number) {
		this.temporal = state
		this.temporalTick = tick()
		task.delay(time, () => {
			if (this.temporal === state && tick() - this.temporalTick >= time) {
				//clearing
				this.temporal = undefined
			}
		})
	}

	/**
	 * When the current state changes
	 * @param callback
	 * @returns
	 */
	onChange(callback: StateCallback<T>) {
		this.changeCallbacks.add(callback)
		return {
			clear: () => {
				this.changeCallbacks.delete(callback)
			},
			call: () => {
				callback(this.get(), this.get())
			}
		}
	}

	/**
	 * When the state list changes
	 * @param callback
	 * @returns
	 */
	onAdd(callback: StateListCallback<T>) {
		this.addCallbacks.add(callback)
		return {
			clear: () => {
				this.addCallbacks.delete(callback)
			}
		}
	}

	/**
	 * When the state list changes
	 * @param callback
	 * @returns
	 */
	onRemove(callback: StateListCallback<T>) {
		this.removeCallbacks.add(callback)
		return {
			clear: () => {
				this.removeCallbacks.delete(callback)
			}
		}
	}

	bindInstance(instance: Instance) {
		const onChange = this.onChange((newState, oldState) => {
			instance.SetAttribute("state", newState)
			instance.SetAttribute("oldState", oldState)
		})

		return {
			clear: () => {
				onChange.clear()
			}
		}
	}

	/**
	 * Creates a collider for the states
	 * @param accepted
	 * @param denied
	 * @returns
	 */
	createCollider(collideWith: T[]): Collider<T> {
		return {
			checkState: () => {
				const who = this.get()
				return  !collideWith.includes(who)
			},
			checkList: () => {
				return !collideWith.some(who => this.listHasState(who))
			},
			check: function() {
				return this.checkState() && this.checkList()
			}
		}
	}
}
