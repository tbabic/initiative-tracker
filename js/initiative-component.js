var homeComponent = new Vue({
	el:"#app",
	data: {
		combat : {
			round : 0,
			initiatives : {
				
			}
		},
		
		newCreature : {
			name : "",
			score: 1,
			number : 1,
			isPlayer : false,
		},
		
		editCreature : {
			reference : {},
			name : null,
			score : null,
			damage : null,
			isPlayer : false,
			oldScore : null,
			oldIndex : null
			
		},
		
		dragAndDropData : {
			source : {
				initiativeScore : null,
				creatureIndex : null
			},
			preview : {
				initiativeScore : null,
				creatureIndex : null,
				lastPreviewAt : 0
			},
		}
	},
	methods: {
		addCreature() {
			let initiatives = this.combat.initiatives;
			let score = this.newCreature.score;
			let name = this.newCreature.name;
			let number = this.newCreature.number;
			let isPlayer = this.newCreature.isPlayer;
			
			
			if (initiatives[score] == undefined) {
				Vue.set(initiatives, score, []);
			}
			
			for (let i = 0; i < number; i++) {
				initiatives[score].push({
					name : name,
					damage : 0,
					isPlayer : isPlayer,
					preview : false,
				});
			}
			
			this.newCreature.name = "";
			this.newCreature.score= 1;
			this.newCreature.number= 1;
			this.newCreature.isPlayer = false;
			this.persist();
			
		},
		
		selectCreatureToEdit(index, initiativeScore) {
			let creature = this.combat.initiatives[initiativeScore][index];
			
			this.editCreature.reference= creature;
			this.editCreature.damage = creature.damage;
			this.editCreature.name = creature.name;
			this.editCreature.score = initiativeScore;
			this.editCreature.isPlayer = creature.isPlayer;
			this.editCreature.oldScore = initiativeScore;
			this.editCreature.oldIndex = index;
		},
		
		saveEditCreature() {
			
			this.editCreature.reference.damage = this.editCreature.damage;
			this.editCreature.reference.name = this.editCreature.name;
			this.editCreature.reference.isPlayer = this.editCreature.isPlayer;
			
			if (this.editCreature.score != this.editCreature.oldScore) {
				let initiatives = this.combat.initiatives;
				if (initiatives[this.editCreature.score] == undefined) {
					Vue.set(initiatives, this.editCreature.score, []);
				}
				
				initiatives[this.editCreature.score].push(this.editCreature.reference);
				this.deleteCreature(this.editCreature.oldScore, this.editCreature.oldIndex);
				
			}
			
			
			
			
			
			
			this.editCreature.reference= {};
			this.editCreature.damage = null;
			this.editCreature.name = null;
			this.editCreature.isPlayer = false;
			this.score = null;
			this.persist();
		},

		startDrag : function (event, initiativeScore, creatureIndex) {
			this.dragAndDropData.source.initiativeScore = initiativeScore;
			this.dragAndDropData.source.creatureIndex = creatureIndex;
		},
		
		deleteCreature : function (initiativeScore, creatureIndex) {
			this.combat.initiatives[initiativeScore].splice(creatureIndex,1);
			//check if there are any remaining creatures in source initiative
			if (this.combat.initiatives[initiativeScore].length < 1) {
				Vue.delete(this.combat.initiatives, initiativeScore);
			}
			this.persist();
		},
		
		deleteAll : function() {
			for (score in this.combat.initiatives) {
				Vue.delete(this.combat.initiatives, score);	
			}
			this.persist();
		},
		
		deleteNPCs : function() {
			for (score in this.combat.initiatives) {
				for (i = this.combat.initiatives[score].length-1; i>= 0; i--) {
					let creature = this.combat.initiatives[score][i];
					if (!creature.isPlayer) {
						this.combat.initiatives[score].splice(i, 1);
					}
				}
				if (this.combat.initiatives[score].length <= 0) {
					Vue.delete(this.combat.initiatives, score);	
				}
				
			}
			this.persist();
		},
		
		resetAllToZero : function() {
			let zeroInitiative = this.combat.initiatives[0];
			if (zeroInitiative == undefined) {
				zeroInitiative = [];
				Vue.set(this.combat.initiatives, 0, zeroInitiative);
			}
			for (score in this.combat.initiatives) {
				if (score == 0) {
					continue;
				}
				for (i = this.combat.initiatives[score].length-1; i>= 0; i--) {
					let creature = this.combat.initiatives[score][i];
					this.combat.initiatives[score].splice(i, 1);
					zeroInitiative.push(creature);
					if (this.combat.initiatives[score].length <= 0) {
						Vue.delete(this.combat.initiatives, score);	
					}
				}
			}
			
			zeroInitiative.forEach(creature => {
				creature.damage = 0;
			});
			
			if(zeroInitiative.length == 0) {
				Vue.delete(this.combat.initiatives, 0);
			}
			
			this.persist();
		},
		
		resetNPCsToZero : function() {
			let zeroInitiative = this.combat.initiatives[0];
			if (zeroInitiative == undefined) {
				zeroInitiative = [];
				Vue.set(this.combat.initiatives, 0, zeroInitiative);
			}
			for (score in this.combat.initiatives) {
				if (score == 0) {
					continue;
				}
				for (i = this.combat.initiatives[score].length-1; i>= 0; i--) {
					let creature = this.combat.initiatives[score][i];
					if (!creature.isPlayer) {
						this.combat.initiatives[score].splice(i, 1);
						zeroInitiative.push(creature);
					}
					if (this.combat.initiatives[score].length <= 0) {
						Vue.delete(this.combat.initiatives, score);	
					}
				}
			}
			
			zeroInitiative.forEach(creature => {
				if (!creature.isPlayer) {
					creature.damage = 0;
				}
			});
			
			if(zeroInitiative.length == 0) {
				Vue.delete(this.combat.initiatives, 0);
			}
			
			this.persist();
		},
		
		preview : function(ev, initiativeScore) {
			
			if (Date.now() < this.dragAndDropData.preview.lastPreviewAt+100) {
				return;
			}
			
			let cursorPosition = ev.clientY;
			
			creatureIndex = $(ev.currentTarget).children().length;
			$(ev.currentTarget).children().each((i, el) => {
				let topPosition = el.getBoundingClientRect().top + $(window)['scrollTop']();
				let bottomPosition = el.getBoundingClientRect().bottom + $(window)['scrollTop']();
				let avgPosition = (+topPosition + +bottomPosition) / 2;
				if (avgPosition > cursorPosition) {
					creatureIndex = $(el).data("index");
					return false;
				}
			});
			
			this.dragAndDropData.preview.initiativeScore = initiativeScore;
			this.dragAndDropData.preview.creatureIndex = creatureIndex;
			this.dragAndDropData.preview.lastPreviewAt = Date.now();
		},
		
		cancelPreview : function() {
			this.dragAndDropData.preview.initiativeScore = null;
			this.dragAndDropData.preview.creatureIndex = null;
			this.dragAndDropData.preview.lastPreviewAt = 0;
		},

		showPreview : function(initiativeScore, creatureIndex) {
			return this.dragAndDropData.preview.initiativeScore == initiativeScore && this.dragAndDropData.preview.creatureIndex == creatureIndex;
		},
		
		onDrop : function (ev, initiativeScore, creatureIndex) {
			
			this.cancelPreview();
			
			let sourceCreature = this.combat.initiatives[this.dragAndDropData.source.initiativeScore][this.dragAndDropData.source.creatureIndex];
			let cursorPosition = ev.clientY;
			
			if (creatureIndex == undefined) {
				creatureIndex = $(ev.currentTarget).children().length;
				$(ev.currentTarget).children().each((i, el) => {
					let topPosition = el.getBoundingClientRect().top + $(window)['scrollTop']();
					let bottomPosition = el.getBoundingClientRect().bottom + $(window)['scrollTop']();
					let avgPosition = (+topPosition + +bottomPosition) / 2;
					if (avgPosition > cursorPosition) {
						creatureIndex = $(el).data("index");
						return false;
					}
				});
			}
			
			let indexOffset = 0;
			
			// check if target and source are on same initiative
			if (this.dragAndDropData.source.initiativeScore == initiativeScore) {
				
				//creature is not moving
				if (this.dragAndDropData.source.creatureIndex == creatureIndex) {
					return;
				}
				if (this.dragAndDropData.source.creatureIndex > creatureIndex) {
					// creature is moved up
					indexOffset = 1;
				}
			}
			
			// if creature is added to the end of the score push otherwise insert
			if(this.combat.initiatives[initiativeScore].length <= creatureIndex) {
				this.combat.initiatives[initiativeScore].push(sourceCreature);
			} else {
				this.combat.initiatives[initiativeScore].splice(creatureIndex, 0, sourceCreature);
			}
			
			
			this.deleteCreature(this.dragAndDropData.source.initiativeScore, this.dragAndDropData.source.creatureIndex+indexOffset);

			this.dragAndDropData.source.initiativeScore = null;
			this.dragAndDropData.source.creatureIndex = null;
			this.persist();
		},
		enterPressedDown : function(ev) {
			if (ev.shiftKey) {
				ev.preventDefault();
				this.addCreature();
			}
		},
		enterPressedUp : function(ev) {
			if (ev.shiftKey) {
				ev.preventDefault();
			}
		},
		
		focusNewCreature : function(event) {
			$("#new-creature-name-id").focus();
			if (event != undefined) {
				event.preventDefault();
			}
		},
		
		focusEditCreature : function(event) {
			$("#edit-creature-name-id").focus();
			if (event != undefined) {
				event.preventDefault();
			}
		},
		
		closeNewCreature : function() {
			$("#close-new-creature").click();
		},
		
		persist : function() {
			let value = JSON.stringify(this.combat.initiatives);
			window.localStorage.setItem("initiatives", value);
		},
		
		load : function() {
			let value = window.localStorage.getItem("initiatives");
			if (value == null || value == undefined) {
				return;
			}
			let initiatives = JSON.parse(value);
			this.combat.initiatives = initiatives;
			
		}
	},
	computed : {
		initiativeScores : function() {
			let scores = [];
			for (let init in this.combat.initiatives) {
				scores.push(init);
			}
			scores.sort((a, b) => {
				return b - a;
			});
			return scores;
		},
	},
	mounted : function () {
		
		$( "#addCreatureModal" ).on('shown.bs.modal', () => {
			this.focusNewCreature();
		});
		
		$( "#editCreatureModal" ).on('shown.bs.modal', () => {
			this.focusEditCreature();
		});
		
		this.load();
		
		/*this.newCreature.name = "test1";
		this.addCreature();
		this.newCreature.name = "test2";
		this.addCreature();
		
		this.newCreature.name = "test3";
		this.newCreature.score = 16;
		this.newCreature.number = 2;
		this.addCreature();*/
	}
});