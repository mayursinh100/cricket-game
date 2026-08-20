extends Node

# ═══════════════════════════════════════════════════════════════
#  MAIN — Entry point. Sets up GameManager, MatchEngine, UI, 3D scene
# ═══════════════════════════════════════════════════════════════

var game_manager: GameManager
var match_engine: MatchEngine
var ui_manager: Control
var cricket_scene: Node3D
var camera: Camera3D

func _ready() -> void:
	# Create game systems
	game_manager = GameManager.new()
	game_manager.name = "GameManager"
	add_child(game_manager)
	
	match_engine = MatchEngine.new()
	match_engine.name = "MatchEngine"
	add_child(match_engine)
	
	# Load save if exists
	if game_manager.has_save():
		game_manager.load_game()
	
	# Create 3D world
	_setup_3d_world()
	
	# Create UI layer
	_setup_ui()
	
	# Show initial screen
	ui_manager.call("show_screen", game_manager.state.get("screen", "menu"))

func _setup_3d_world() -> void:
	# Create a viewport for 3D
	var viewport := SubViewport.new()
	viewport.name = "MatchViewport"
	viewport.size = Vector2i(1280, 720)
	viewport.render_target_update_mode = SubViewport.UPDATE_ALWAYS
	viewport.size_flags_vertical = Control.SIZE_EXPAND_FILL
	viewport.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	
	# Camera
	camera = Camera3D.new()
	camera.position = Vector3(0, 9, 20)
	camera.fov = 48
	viewport.add_child(camera)
	
	# Environment
	var env := Environment.new()
	env.background_mode = Environment.BG_COLOR
	env.background_color = Color(0.29, 0.56, 0.85)
	env.ambient_light_source = Environment.AMBIENT_SOURCE_COLOR
	env.ambient_light_color = Color(0.8, 0.85, 0.95)
	env.ambient_light_energy = 0.5
	env.fog_enabled = true
	env.fog_light_color = Color(0.55, 0.77, 0.91)
	env.fog_density = 0.001
	
	var world_env := WorldEnvironment.new()
	world_env.environment = env
	viewport.add_child(world_env)
	
	# Sun light
	var sun := DirectionalLight3D.new()
	sun.light_color = Color(1, 0.96, 0.88)
	sun.light_energy = 1.3
	sun.position = Vector3(50, 70, 30)
	sun.rotation = Vector3(-PI/4, PI/6, 0)
	sun.shadow_enabled = true
	viewport.add_child(sun)
	
	# Fill light
	var fill := DirectionalLight3D.new()
	fill.light_color = Color(0.69, 0.81, 1)
	fill.light_energy = 0.35
	fill.position = Vector3(-30, 20, -30)
	viewport.add_child(fill)
	
	# Hemisphere light
	var hemi := HemisphereLight3D.new()
	hemi.light_color = Color(0.53, 0.73, 1)
	hemi.ground_color = Color(0.18, 0.55, 0.18)
	hemi.light_energy = 0.3
	viewport.add_child(hemi)
	
	# Create cricket scene
	cricket_scene = CricketScene.new()
	cricket_scene.name = "CricketScene3D"
	viewport.add_child(cricket_scene)
	
	add_child(viewport)
	viewport.visible = false

func _setup_ui() -> void:
	ui_manager = Control.new()
	ui_manager.set_anchors_preset(Control.PRESET_FULL_RECT)
	ui_manager.name = "UIManager"
	var script := load("res://scripts/UIManager.gd")
	ui_manager.set_script(script)
	
	var content := VBoxContainer.new()
	content.name = "Content"
	content.set_anchors_preset(Control.PRESET_FULL_RECT)
	content.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	content.size_flags_vertical = Control.SIZE_EXPAND_FILL
	ui_manager.add_child(content)
	
	add_child(ui_manager)
	
	game_manager.screen_changed.connect(_on_screen_changed)

func _on_screen_changed(screen_name: String) -> void:
	var viewport := get_node_or_null("MatchViewport")
	if viewport:
		viewport.visible = (screen_name == "match")
	
	if screen_name == "match":
		var match_ui := Control.new()
		match_ui.name = "MatchUI"
		match_ui.set_anchors_preset(Control.PRESET_FULL_RECT)
		var script := load("res://scripts/MatchUI.gd")
		match_ui.set_script(script)
		add_child(match_ui)
	else:
		var match_ui := get_node_or_null("MatchUI")
		if match_ui:
			match_ui.queue_free()